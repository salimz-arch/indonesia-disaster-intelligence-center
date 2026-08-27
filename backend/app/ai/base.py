"""AIProvider abstraction."""
from abc import ABC, abstractmethod
from typing import ClassVar


class AISituationOutput(dict):
    pass

class AIProvider(ABC):
    name: ClassVar[str]

    @abstractmethod
    async def analyze(self, context: dict, risk: dict) -> AISituationOutput:
        pass
