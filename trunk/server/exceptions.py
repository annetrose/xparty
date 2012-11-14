from server import model_access
from server.utils import helpers
import sys, traceback
                        
class XPartyException(Exception):
    error = "Unknown exception"
    
    def __init__(self, *args, **kwargs):
        super(XPartyException, self).__init__(*args, **kwargs)
        helpers.log( traceback.format_exception(*(sys.exc_info())) )

    def log(self):
        helpers.log( self.__class__.__name__ + ": " + "".join("\n - %s"%a for a in self.args) )
        
    def write_response_as_json(self, request):
        msg = self.args[0] if len(self.args)>=1 else None
        if msg is None:
            msg = self.error
        request.write_response_as_json({ "status": 0, "msg": msg })
                
class ActivityAccessDeniedError(XPartyException):
    error = "Access to activity denied"
    
    @staticmethod
    def check(user, activity):
        is_admin = model_access.is_admin_logged_in(user)
        is_teacher_activity = model_access.is_teacher_logged_in(user) and model_access.is_same_person(activity.teacher, user) if activity is not None else False
        is_student_activity = model_access.is_student_logged_in(user) and model_access.is_same_activity(activity, user.activity) if activity is not None else False
        can_access_activity = is_admin or is_teacher_activity or is_student_activity
        return not can_access_activity
    
class ActivityNotFoundError(XPartyException):
    error = "Activity not found"
    
    @staticmethod 
    def check(activity):
        return activity is None
  
class NotAnActiveActivityError(XPartyException):
    error = "Activity not active"
    
    @staticmethod
    def check(activity):
        return not activity.is_active or activity.is_deleted
      
class NotAnAuthenticatedAdminError(XPartyException):
    error = "Admin not logged in"
    
    @staticmethod
    def check(user):
        return not model_access.is_admin_logged_in(user)
    
class NotAnAuthenticatedStudentError(XPartyException):
    error = "Student not logged in"
    
    @staticmethod    
    def check(user):
        return not model_access.is_student_logged_in(user)
    
class NotAnAuthenticatedTeacherError(XPartyException):
    error = "Teacher not logged in"
    
    @staticmethod
    def check(user):
        return not model_access.is_teacher_logged_in(user)
        
class WrongPersonError(XPartyException):
    error = "Wrong person"
    
    @staticmethod
    def check(person1, person2):
        return not model_access.is_same_person(person1, person2)  
    
class UnknownActionError(XPartyException):
    error = "Unknown action"  