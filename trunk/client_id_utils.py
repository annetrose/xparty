_TIMESTAMP_FORMAT = "%Y%m%d-%H%M%S"
_DELIMITER = "-"
_RANDOM_JUNK_SUFFIX_LENGTH = 12

def create_client_id(person_type, person_key, lesson_code):
    assert person_type in ("teacher", "student")
    prefix = {"teacher":"T", "student":"S"}[person_type]
    assert prefix in ("T", "S")

    import time, random, string
    person_key = person_key.replace("-", "&ndash;");
    timestamp = time.strftime(_TIMESTAMP_FORMAT)
    alphabet = string.letters + string.digits
    random_stuff = "".join(random.choice(alphabet) for i in range(_RANDOM_JUNK_SUFFIX_LENGTH))
    client_id = _DELIMITER.join((prefix, person_key, lesson_code, timestamp, random_stuff))
    return client_id

def person_type_for_client_id(client_id):
    if client_id.startswith("T"):
        return "teacher"
    elif client_id.startswith("S"):
        return "student"
    else:
        assert False, "Bad client ID:  %r"%client_id

def person_key_for_client_id(client_id):
    tokens = client_id.split(_DELIMITER)
    person_key = tokens[1];
    person_key = person_key.replace("&ndash;", "-")
    return person_key

def lesson_code_for_client_id(client_id):
    tokens = client_id.split(_DELIMITER)
    return tokens[2]

def timestamp_for_client_id(client_id):
    from datetime import datetime
    import re
    timestamp_part_re = r"(\d{8}-\d{6})" + _DELIMITER + ".{%d}"%_RANDOM_JUNK_SUFFIX_LENGTH + "$"
    timestamp_part = re.search(timestamp_part_re, client_id).group(1)
    timestamp = datetime.strptime(timestamp_part, _TIMESTAMP_FORMAT)
    return timestamp

def is_client_id_expired(client_id):
    # Cutoff is 2 hours
    #
    # "Tokens expire in two hours. If a client remains connected to a channel
    # for longer than two hours, the socket's onerror() and onclose() callbacks
    # are called. At this point the client can make an XHR request to the
    # application to request a new token."
    # http://code.google.com/appengine/docs/python/channel/overview.html

    from datetime import datetime, timedelta
    now = datetime.now()
    age = now - timestamp_for_client_id(client_id)
    limit = timedelta(hours=2)
    return (age > limit)
