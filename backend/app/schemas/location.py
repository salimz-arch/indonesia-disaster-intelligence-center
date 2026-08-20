"""Canonical location schema."""
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import IndonesiaLatitude, IndonesiaLongitude


class LocationCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    region: str = Field(min_length=1, max_length=100)
    latitude: IndonesiaLatitude
    longitude: IndonesiaLongitude
    timezone: str = Field(default="Asia/Jakarta", max_length=50)
    is_primary: bool = False


class LocationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    region: str
    latitude: float
    longitude: float
    timezone: str
    is_primary: bool
