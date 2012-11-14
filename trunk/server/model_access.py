# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created September 2012
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from server import channel
from server.model import Activity, Student, Teacher, StudentAction
from server.utils import helpers
from google.appengine.ext import db
import datetime, random

EXPECTED_UPPER_BOUND = 10000

#===================================================================================
# Person
#===================================================================================

def add_client_id_to_person(client_id):
    person = channel.person_for_client_id(client_id)
    if person is None:
        return -1
    
    if person.client_ids is None:
        person.client_ids = []
    
    if client_id is not None and client_id not in person.client_ids:
        person.client_ids.append(client_id)    
        if is_student(person) and len(person.client_ids) == 1:
            person.latest_logout_timestamp = None
        person.put()
            
    # check if student just logged in
    if is_student(person) and len(person.client_ids)==1:
        channel.send_student_log_in(student=person)
            
    return len(person.client_ids)
    
def remove_client_id_from_person(client_id):
    person = channel.person_for_client_id(client_id)
    if person is None:
        return -1
    
    if person.client_ids is None:
        person.client_ids = []
            
    if client_id is not None and client_id in person.client_ids:
        person.client_ids.remove(client_id)
        if is_student(person) and len(person.client_ids) == 0:
            person.client_ids = []
            person.latest_logout_timestamp = datetime.datetime.now()    
        person.put()
      
    # check if student just logged out
    if is_student(person) and len(person.client_ids)==0:
        channel.send_student_log_out(student=person)
              
    return len(person.client_ids)

def log_out_person(person):
    if person is not None:
        person.client_ids = []
        if is_student(person):
            person.latest_logout_timestamp = datetime.datetime.now()
            person.session_sid = None
        person.put()
        
        # check if student just logged out
        if is_student(person):
            channel.send_student_log_out(student=person)

def get_person_key(person):
    return person.nickname if is_student(person) else _get_teacher_id(person) if is_teacher(person) else None

def get_person_nickname(person):
    return "Anonymous" if is_student_logged_in(person) and is_student_anonymous(person) else person.nickname if person is not None else None

def get_person_type(person):
    if person is None:
        return None
    elif is_student(person):
        return "student"
    elif is_teacher(person):
        return "teacher"
    else:
        return None
    
def is_same_person(person1, person2):
    return person1 is not None and person1 is not None and person1.key() == person2.key()

#===================================================================================
# Teacher
#===================================================================================

def get_teacher(teacher_nickname):
    return Teacher.get_by_key_name(teacher_nickname)
    
def get_teachers():
    filters = [];
    teachers = _fetch_all(Teacher, filters)
    return teachers

def create_teacher(user):
    # key is user ID of authenticated Google user
    teacher = Teacher(key_name=user.user_id()) 
    teacher.user = user
    teacher.put()
    return teacher
 
def is_teacher(person):
    return person is not None and isinstance(person, Teacher)
    
def is_teacher_logged_in(person):
    return is_teacher(person) and person.is_logged_in

def is_admin(person):
    return is_teacher(person) and person.admin

def is_admin_logged_in(person):
    return is_admin(person) and person.is_logged_in

def _get_teacher_id(teacher):
    return teacher.user.user_id()

#===================================================================================
# Student
#===================================================================================

def get_student(student_nickname=None, activity_code=None, session_sid=None):
    student = None
    if session_sid is not None:
        students = _fetch_all(Student, [("session_sid =", session_sid)])
        for match in students:
            student = match
    elif student_nickname is not None and activity_code is not None:
        key_name = Student.make_key_name(student_nickname, activity_code)
        student = Student.get_by_key_name(key_name)
    return student
                    
def get_students(activity=None, only_logged_in=False, as_json=False):
    filters = [];
    if activity is not None:
        filters.append(("activity =", activity))
    if only_logged_in:
        filters.append(("lastest_logout_timestamp =", None))
    students = _fetch_all(Student, filters) 
    
    student_list = []
    for student in students:
        item = student if not as_json else helpers.to_json(student.to_dict())
        student_list.append(item)
               
    return student_list

def create_student(data): 
    now = datetime.datetime.now()
    student = Student(
        key_name = Student.make_key_name(data['student_nickname'], data['activity'].activity_code),
        nickname = data['student_nickname'],
        activity = data['activity'],
        first_login_timestamp = now,
        latest_login_timestamp = now,
        latest_logout_timestamp = None,
        anonymous = data['anonymous'],
        session_sid = data['session_sid']
    )
    student.put()
    return student

def update_student_login_time(student, session_sid=None):
    if is_student(student): 
        student.latest_login_timestamp = datetime.datetime.now()
        student.latest_logout_timestamp = None
        if session_sid:
            student.session_sid = session_sid
        student.put()
    return student

def is_student(person):
    return person is not None and isinstance(person, Student)

def is_student_logged_in(person):
    return is_student(person) and person.is_logged_in

def is_student_anonymous(person):
    return is_student(person) and person.anonymous

#===================================================================================
# Activity
#===================================================================================
    
def get_activity(activity_code=None, client_id=None):
    activity = None
    if client_id is not None:
        activity_code = channel.activity_code_for_client_id(client_id)
    if activity_code is not None:
        activity = Activity.get_by_key_name(activity_code)
    return activity
    
def get_activities(teacher=None, do_not_include_deleted=True, as_json=False):
    filters = [];
    if teacher is not None:
        filters.append(("teacher =", teacher))
    if do_not_include_deleted:
            filters.append(("deleted_time =", None))
    activities = _fetch_all(Activity, filters, "title")
    
    activity_list = []
    for activity in activities:
        item = activity if not as_json else helpers.to_json(activity.to_dict())
        activity_list.append(item)
    return activity_list

def create_activity(data):
    activity_code = _create_activity_code()
    now = datetime.datetime.now()
    activity = Activity(
        key_name = activity_code,
        activity_code = activity_code,
        activity_type = data['activity_type'],
        teacher = data['teacher'],
        title = data['title'], 
        class_name = data['class_name'], 
        description = data['description'], 
        tasks_json = data['tasks_json'], 
        start_time = now, 
        stop_time = None
    )
    activity.put()
    return activity

def update_activity(activity, data):
    for attr in data:
        setattr(activity, attr, data[attr])
    activity.put()
    return activity
        
def copy_activity(activity):        
    task_infos = []
    for task_idx in range(0, len(activity.tasks)):
        task_title = activity.tasks[task_idx][0];
        if task_title != "":
            task_description = activity.tasks[task_idx][1];
            task_infos.append((task_title, task_description))
    tasks_json = helpers.to_json(task_infos)
        
    data = {
        'activity_code': _create_activity_code(),
        'activity_type': activity.activity_type,
        'teacher': activity.teacher,
        'title': activity.title + " (Clone)",
        'class_name': activity.class_name,
        'description': activity.description, 
        'tasks_json': tasks_json
    }
    return create_activity(data)

def start_activity(activity):
    if activity is not None:
        activity.stop_time = None
        activity.put()

def stop_activity(activity):
    if activity is not None:
        now = datetime.datetime.now()
        activity.stop_time = now
        activity.put()
 
def clear_activity(activity):
    if activity is not None:
        filters = [("activity =", activity)]
        db.delete(_fetch_all(StudentAction, filters))
        db.delete(_fetch_all(Student, filters))
    
def delete_activity(activity):
    if activity is not None:
        now = datetime.datetime.now()
        activity.deleted_time = now
        if activity.stop_time is None:
            activity.stop_time = now
        activity.put()
        
def is_same_activity(activity1, activity2):
    return activity1 is not None and activity2 is not None and activity1.key() == activity2.key()

def _create_activity_code():
    # This is essentially a do loop, but I'm using a generous upper bound to prevent the
    # possibility of an endless (and potentially costly) spin, in case of a bug, for example.
    digits = 5
    for i in range(1000):
        n = random.randint(0,10**digits - 1)
        activity_code = "%05d"%n
        activity = Activity.get_by_key_name(activity_code)
        if activity is None:
            break
    return activity_code
        
#===================================================================================
# StudentAction
#===================================================================================

def get_student_actions(activity, task_idx=None, student=None, group_by_task=False, as_json=False):
    action_list = None
    if activity is not None:
        filters = [("activity =", activity)]
        if task_idx is not None:
            filters.append(("task_idx =", task_idx))
        if student is not None:
            filters.append(("student =", student))
        actions = _fetch_all(StudentAction, filters, "timestamp")    
        
        action_list = []
        if group_by_task:
            for task_idx in activity.tasks:
                action_list.append([])
                
        for action in actions:
            item = action if not as_json else helpers.to_json(action.to_dict())
            item_list = action_list[action.task_idx] if group_by_task else action_list
            item_list.append(item)
            
    return action_list

def add_student_action(student, task_idx, action_type, action_description, action_data):    
    action = StudentAction(
        student = student,
        activity = student.activity,
        task_idx = task_idx,
        action_type = action_type,
        action_description = action_description,
        action_data_json = helpers.to_json(action_data)
    )
    action.put()  
    channel.send_student_action(student=student, task_idx=task_idx, action_type=action_type, action_description=action_description, action_data=action_data)      
    return action
        
#===================================================================================
# Misc
#===================================================================================

def _fetch_all(model_class, filters=[], sort=None, sort_key_fn=None):
        def get_query():
            query = model_class.all()
            for (filter_expr, filter_value) in filters:
                query = query.filter(filter_expr, filter_value)
            if sort is not None:
                query.order(sort)
            return query

        items = get_query().fetch(EXPECTED_UPPER_BOUND)
        
        if len(items) >= EXPECTED_UPPER_BOUND:
            helpers.log("ERROR: Upper bound is apparently not big enough.")
            items = list(get_query())

        if sort_key_fn is not None:
            items.sort(key=sort_key_fn)

        return tuple(items)