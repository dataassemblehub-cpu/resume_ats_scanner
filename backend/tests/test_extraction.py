import pytest
from app.utils.extraction import extract_email, extract_phone, extract_name

def test_extract_email():
    text_with_email = "Hello, my email is john.doe@example.com. Contact me there."
    assert extract_email(text_with_email) == "john.doe@example.com"

    text_no_email = "Hello, no email here."
    assert extract_email(text_no_email) is None

    text_multiple_emails = "Primary: first@test.com, Secondary: second@test.com"
    assert extract_email(text_multiple_emails) == "first@test.com"


def test_extract_phone():
    test_cases = [
        ("Call me at +1 (123) 456-7890", "+1 (123) 456-7890"),
        ("Phone: 123-456-7890", "123-456-7890"),
        ("My number is +91 98765 43210.", "+91 98765 43210"),
        ("Reach out to 555.555.5555 for queries", "555.555.5555"),
        ("No phone number here", None)
    ]
    for text, expected in test_cases:
        assert extract_phone(text) == expected


def test_extract_name():
    # Basic name extraction from first few lines
    resume_text = (
        "Alice Smith\n"
        "Software Engineer\n"
        "alice.smith@example.com | 123-456-7890\n"
        "EXPERIENCE\n"
        "Python Developer..."
    )
    assert extract_name(resume_text) == "Alice Smith"

    # Testing name extraction where first line is section or contact info
    resume_text_with_headers = (
        "RESUME\n"
        "alice.smith@example.com\n"
        "Bob Johnson\n"
        "Data Scientist\n"
        "EDUCATION"
    )
    assert extract_name(resume_text_with_headers) == "Bob Johnson"
