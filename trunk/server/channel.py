# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created October 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from google.appengine.api import channel
import datetime, json, random, re, string, time

_TIMESTAMP_FORMAT = "%Y%m%d-%H%M%S"
_DELIMITER = "-"
_RANDOM_JUNK_SUFFIX_LENGTH = 12
    
def create_channel(person, lesson_code):
    from server.model_access import get_person_key, get_person_type
    person_key = get_person_key(person)
    token = None
    if person_key is not None:
        client_id = _create_client_id(person_type=get_person_type(person), person_key=person_key, lesson_code=lesson_code)
        token = channel.create_channel(client_id)
    return token
    
def person_for_client_id(client_id):
    person = None
    person_key = _person_key_for_client_id(client_id)
    person_type = _person_type_for_client_id(client_id)

    if person_type == "teacher":
        from server.model_access import get_teacher
        person = get_teacher(person_key)
    else:
        from server.model_access import get_student
        lesson_code = lesson_code_for_client_id(client_id)
        person = get_student(person_key, lesson_code)
        
    return person

def lesson_code_for_client_id(client_id):
    tokens = client_id.split(_DELIMITER)
    return tokens[2]

def send_student_log_in(student):
    _send_message_to_teacher(student, "log_in")

def send_student_log_out(student):
    _send_message_to_teacher(student, "log_out")
    
def send_student_action(student, task_idx, action_type, action_description, action_data):
    action_data["task_idx"] = task_idx
    _send_message_to_teacher(student, action_type, action_description, action_data)

def _create_client_id(person_type, person_key, lesson_code):
    prefix = {"teacher":"T", "student":"S"}[person_type]
    person_key = person_key.replace("-", "&ndash;");
    timestamp = time.strftime(_TIMESTAMP_FORMAT)
    alphabet = string.letters + string.digits
    random_stuff = "".join(random.choice(alphabet) for i in range(_RANDOM_JUNK_SUFFIX_LENGTH))
    client_id = _DELIMITER.join((prefix, person_key, lesson_code, timestamp, random_stuff))
    return client_id
                        
def _person_type_for_client_id(client_id):
    if client_id.startswith("T"):
        return "teacher"
    elif client_id.startswith("S"):
        return "student"
    else:
        return None

def _person_key_for_client_id(client_id):
    tokens = client_id.split(_DELIMITER)
    person_key = tokens[1];
    person_key = person_key.replace("&ndash;", "-")
    return person_key

def _timestamp_for_client_id(client_id):
    timestamp_part_re = r"(\d{8}-\d{6})" + _DELIMITER + ".{%d}"%_RANDOM_JUNK_SUFFIX_LENGTH + "$"
    timestamp_part = re.search(timestamp_part_re, client_id).group(1)
    timestamp = datetime.datetime.strptime(timestamp_part, _TIMESTAMP_FORMAT)
    return timestamp
 
def _send_message(from_person, to_person, *msg):
    # Add timestamp to message data
    timestamp = datetime.datetime.now()
    msg_list = list(msg)
    msg_list[0]['timestamp'] = timestamp.strftime('%B %d, %Y %H:%M:%S')
    msg_json = json.dumps(msg_list)
        
    for client_id in to_person.client_ids:
        channel.send_message(client_id, msg_json)

def _send_message_to_teacher(student, action_type, action_description="", action_data={}):
    msg = { "student_nickname":student.nickname, "lesson_code":student.lesson.lesson_code, "action_type":action_type, "action_description":action_description, "action_data":action_data}
    _send_message(student, student.lesson.teacher, msg)