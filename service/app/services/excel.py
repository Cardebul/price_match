import pandas as pd
from typing import List, Dict, Any, Type, TypeVar
from pydantic import BaseModel, ValidationError

T = TypeVar("T", bound=BaseModel)


def _detect_engine(file_path: str) -> str:
    return "xlrd" if str(file_path).lower().endswith(".xls") else "openpyxl"


def get_excel_preview(file_path: str, limit: int = 20) -> List[List[Any]]:
    try:
        engine = _detect_engine(file_path)
        df = pd.read_excel(file_path, nrows=limit, header=None, engine=engine)
        df = df.where(pd.notnull(df), None)
        return df.values.tolist()
    except Exception as e:
        return [[f"Error reading file: {str(e)}"]]


class ExcelParser:
    MAX_STORED_ERRORS = 200

    def __init__(self, file_path: str):
        self.file_path = file_path
        self._df = None
        self.errors: List[tuple[int, str]] = []
        self.skipped_count = 0

    def __enter__(self):
        engine = _detect_engine(self.file_path)
        self._df = pd.read_excel(self.file_path, header=None, engine=engine)
        self._df = self._df.where(pd.notnull(self._df), None)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self._df = None

    @property
    def total_rows(self) -> int:
        return len(self._df) if self._df is not None else 0

    def iter_rows(
        self,
        schema: Type[T],
        mapping: Dict[str, Any],
        start_row: int = 1,
    ):
        if self._df is None:
            return

        for i in range(start_row - 1, len(self._df)):
            row = self._df.iloc[i]
            row_num = i + 1

            if row.isnull().all():
                continue

            raw_data: Dict[str, Any] = {}

            for field, col_idx in mapping.items():
                if field in ("extra", "start_row"):
                    continue
                if isinstance(col_idx, int) and 0 <= col_idx < len(row):
                    raw_data[field] = row[col_idx]

            if "extra" in mapping and isinstance(mapping["extra"], dict):
                for extra_field, col_idx in mapping["extra"].items():
                    if isinstance(col_idx, int) and 0 <= col_idx < len(row):
                        raw_data[extra_field] = row[col_idx]

            try:
                validated = schema.model_validate(raw_data)
                yield row_num, validated
            except ValidationError as e:
                self.skipped_count += 1
                if len(self.errors) < self.MAX_STORED_ERRORS:
                    first = e.errors()[0]
                    field = ".".join(str(p) for p in first.get("loc", ())) or "?"
                    self.errors.append((row_num, f"{field}: {first.get('msg', 'invalid')}"))
                continue