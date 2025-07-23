from django.core.validators import RegexValidator

only_letters_numbers_spaces = RegexValidator(
    regex=r'^[a-zA-Z0-9 ]+$',
    message='the field only accept letters, numbers and space.',
)

only_letters_numbers_symbols = RegexValidator(
    regex=r'^[a-zA-Z0-9.,;:#()\-\u00f1\u00d1áéíóúÁÉÍÓÚÑ\s\S]+(?: [a-zA-Z0-9.,;:#()\-\u00f1\u00d1áéíóúÁÉÍÓÚÑ\s\S]+)*$',
    message='the field only accepts letters, numbers, and single spaces between words. allowed symbols: . , ; : # ( ) -',
)

only_letters_numbers = RegexValidator(
    regex=r'^[a-zA-Z0-9]+$',
    message='the field only accept letters and numbers, not space',
)

only_lters_for_names = RegexValidator(
    regex=r'^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s.,;:()\-]+$',
    message='the field accepts letters, numbers, accents, spaces and common punctuation.',
)

only_numbers = RegexValidator(
    regex=r'^\d+$',
    message='the field only accept numbers.',
)

only_letters_numbers_spot = RegexValidator(
    regex=r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ .]+$',
    message='the field only accepts letters, numbers, spaces, and periods (no line breaks).',
)