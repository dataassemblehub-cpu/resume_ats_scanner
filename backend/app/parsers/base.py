from abc import ABC, abstractmethod

class BaseParser(ABC):
    @abstractmethod
    def parse(self, file_content: bytes) -> str:
        """
        Parses raw binary file content and returns extracted text.
        """
        pass
