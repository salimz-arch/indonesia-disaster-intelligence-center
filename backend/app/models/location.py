"""ORM: locations — titik pantau utama (kota/kabupaten)."""
import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Location(Base):
    __tablename__ = "locations"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(sa.String(100), unique=True, nullable=False)
    region: Mapped[str] = mapped_column(sa.String(100), nullable=False)
    latitude: Mapped[float] = mapped_column(sa.Float, nullable=False)
    longitude: Mapped[float] = mapped_column(sa.Float, nullable=False)
    # IANA timezone — dasar konversi WIB/WITA/WIT di presentation layer
    timezone: Mapped[str] = mapped_column(
        sa.String(50), default="Asia/Jakarta", nullable=False
    )
    is_primary: Mapped[bool] = mapped_column(default=False, nullable=False)

    def __repr__(self) -> str:
        return f"<Location {self.name!r}>"
