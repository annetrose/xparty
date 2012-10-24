# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: September 2012
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from server import settings
from server.utils import helpers
from google.appengine.ext import db
import datetime

class Person(db.Model):
    # PROPERTIES
    client_ids = db.StringListProperty(default=[])
    first_login_timestamp = db.DateTimeProperty(auto_now_add=True)

class Teacher(Person):
    # PROPERTIES
    user = db.UserProperty()  # authenticated Google user
    nickname = property(lambda self: self.user.nickname())  # name of authenticated Google user
    admin = db.BooleanProperty(default=False)
    is_logged_in = property(lambda self: self.user is not None)
    
    def __repr__(self):
        properties_to_show = [self.nickname]
        return "{0}({1})".format(self.__class__.__name__, repr(tuple(properties_to_show)))

class Lesson(db.Model):
    # PROPERTIES
    activity_type = db.StringProperty()
    lesson_code = db.StringProperty()
    teacher = db.ReferenceProperty(Teacher)
    title = db.StringProperty()
    description = db.StringProperty(multiline=True)
    class_name = db.StringProperty()
    tasks_json = db.TextProperty()
    start_time = db.DateTimeProperty()
    stop_time = db.DateTimeProperty()
    deleted_time = db.DateTimeProperty()
    is_active = property(lambda self: (self.start_time is not None) and (self.stop_time is None))
    is_deleted = property(lambda self: self.deleted_time is not None)

    @property
    def tasks(self):
        return helpers.from_json(self.tasks_json)
    
    def to_dict(self):
        return {
            'lesson_code':      self.lesson_code,
            'activity_type':    self.activity_type,
            'teacher_nickname': self.teacher.nickname,
            'title':            self.title,
            'class_name':       self.class_name,
            'description':      self.description,
            'tasks':            self.tasks,
            'start_time':       self.start_time,
            'stop_time':        self.stop_time,
            'deleted_time':     self.deleted_time,
            'is_active':        self.is_active
        }
            
    def __repr__(self):
        return "{0}({1})".format(self.__class__.__name__, repr(self.to_dict().items()))
    
class Student(Person):
    # PROPERTIES
    nickname = db.StringProperty()
    lesson = db.ReferenceProperty(Lesson)
    anonymous = db.BooleanProperty(default=False)
    latest_login_timestamp = db.DateTimeProperty()
    latest_logout_timestamp = db.DateTimeProperty()
    session_sid = db.StringProperty()
        
    @property
    def is_logged_in(self):
        if self.latest_login_timestamp is None:
            return False
        if self.latest_logout_timestamp is None:
            return True
        elif self.latest_logout_timestamp < self.latest_login_timestamp:
            return True
        else:
            return False
    
    @property
    def is_session_timed_out(self):
        return datetime.datetime.now() > self.latest_login_timestamp + settings.STUDENT_SESSION_TIMEOUT

    @classmethod
    def make_key_name(self, student_nickname, lesson_code):
        return "::".join((student_nickname, lesson_code))
    
    def to_dict(self):
        return {
            'nickname':                 self.nickname,
            'lesson_code':              self.lesson.lesson_code,
            'anonymous':                self.anonymous,
            'first_login_timestamp':    self.first_login_timestamp,
            'latest_login_timestamp':   self.latest_login_timestamp,
            'latest_logout_timestamp':  self.latest_logout_timestamp,
            'is_logged_in':             self.is_logged_in
        }
            
    def __repr__(self):
        properties_to_show = [self.key().name()]
        return "{0}({1})".format(self.__class__.__name__, repr(tuple(properties_to_show)))
    
class StudentAction(db.Model):
    # PROPERTIES
    student = db.ReferenceProperty(Student)
    lesson = db.ReferenceProperty(Lesson)
    task_idx = db.IntegerProperty()
    action_type = db.StringProperty()
    action_description = db.StringProperty()
    action_data_json = db.TextProperty()
    timestamp = db.DateTimeProperty(auto_now_add=True)
        
    @property
    def action_data(self):
        return helpers.from_json(self.action_data_json)
    
    def to_dict(self):
        return {
            'student_nickname':     self.student.nickname,
            'lesson_code':          self.lesson.lesson_code,
            'task_idx':             self.task_idx,
            'action_type':          self.action_type,
            'action_description':   self.action_description,
            'action_data':          self.action_data,
            'timestamp':            self.timestamp.strftime("%B %d, %Y %H:%M:%S %Z")
        }
            
    def __repr__(self):
        return "{0}({1})".format(self.__class__.__name__, repr(self.to_dict().items()))
