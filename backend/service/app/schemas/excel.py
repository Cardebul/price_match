from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


class BaseRowSchema(BaseModel):
    model_config = ConfigDict(extra="allow", coerce_numbers_to_str=True)

    @field_validator("*", mode="before")
    @classmethod
    def empty_string_to_none(cls, v: Any) -> Any:
        if isinstance(v, str) and v.strip() == "":
            return None
        return v


class PriceListRowSchema(BaseRowSchema):
    article: str | None = Field(None, max_length=255)
    name: str = Field(max_length=512)
    price: Decimal = Field(default=Decimal("0.00"))
    unit: str | None = Field(None, max_length=50)

    @field_validator("price", mode="before")
    @classmethod
    def clean_price(cls, v: Any) -> Decimal:
        if v is None:
            return Decimal("0.00")
        if isinstance(v, (int, float, Decimal)):
            return Decimal(str(v))
        if isinstance(v, str):
            s = v.strip().replace(" ", "").replace("\xa0", "")
            if not s:
                return Decimal("0.00")
            if "," in s and "." in s:
                if s.rfind(",") > s.rfind("."):
                    s = s.replace(".", "").replace(",", ".")
                else:
                    s = s.replace(",", "")
            elif "," in s:
                s = s.replace(",", ".")
            s = "".join(c for c in s if c.isdigit() or c in ".-")
            try:
                return Decimal(s)
            except Exception:
                raise ValueError(f"некорректная цена: {v}")
        raise ValueError(f"некорректная цена: {v}")


class EstimateRowSchema(BaseRowSchema):
    name: str = Field(..., max_length=512)
    article: str | None = Field(None, max_length=255)
    unit: str | None = Field(None, max_length=50)
    quantity: Decimal | None = Field(None)


class MappingSchema(BaseModel):
    model_config = ConfigDict(extra="allow")

    start_row: int = Field(default=1, ge=1)
    extra: dict[str, int] = Field(default_factory=dict)

    @field_validator("extra", mode="before")
    @classmethod
    def validate_extra(cls, v: Any) -> dict:
        if v is None:
            return {}
        if not isinstance(v, dict):
            raise ValueError("extra должен быть словарём {имя_поля: индекс_колонки}")
        for key, val in v.items():
            if not isinstance(val, int) or val < 0:
                raise ValueError(
                    f"Значение для поля '{key}' в extra должно быть "
                    f"неотрицательным целым числом (индекс колонки)"
                )
        return v
