# XParty - A Framework for Building Tools for Learning in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created October 17, 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from google.appengine.api import channel
import json

def _send_update(from_person, to_person, *updates):
    from model import Student, Teacher
    from client_id_utils import timestamp_for_client_id
    from helpers import log

    assert isinstance(to_person, (Student,Teacher)), repr(to_person)

    import datetime
    timestamp = datetime.datetime.now()
    updates_list = list(updates)
    updates_list[0]['timestamp'] = timestamp.strftime('%B %d, %Y %H:%M:%S')
    updates_json = json.dumps(updates_list)

    # Sort and dedupe client_ids by timestamp, descending
    client_ids = set(to_person.client_ids)
    key_fn = lambda client_id:timestamp_for_client_id(client_id)
    client_ids = sorted(client_ids, key=key_fn, reverse=True)
    
    if len(client_ids)==0:
        log("=> MESSAGE NOT SENT. No current client IDs for {0}.".format(to_person))
    
    for client_id in client_ids:
        log( "client ID : %r : sent %s"%(client_id," + ".join(u["activity_type"] for u in updates)) )
        channel.send_message(client_id, updates_json)

def send_update_log_in(student, teacher):
    update = {"student_nickname":student.nickname, "lesson_code":student.lesson.lesson_code, "activity_type":"log_in", "activity_data":{} }
    _send_update(student, teacher, update)

def send_update_log_out(student, teacher):
    update = {"student_nickname":student.nickname, "lesson_code":student.lesson.lesson_code, "activity_type":"log_out", "activity_data":{} }
    _send_update(student, teacher, update)

def send_update_task(student, teacher, task_idx):
    update = {"student_nickname":student.nickname, "lesson_code":student.lesson.lesson_code, "activity_type":"task", "activity_data":{"task_idx":task_idx}  }
    _send_update(student, teacher, update)
    
def send_student_activity(student, teacher, task_idx, activity_type, activity_data):
    activity_data["task_idx"] = task_idx;
    update = {"student_nickname":student.nickname, "lesson_code":student.lesson.lesson_code, "activity_type":activity_type, "activity_data":activity_data }
    _send_update(student, teacher, update)