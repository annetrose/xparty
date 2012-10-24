# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from XPartyView import XPartyView
from server import channel
from server import exceptions
from server import model_access
from server.utils import helpers

class TeacherPage(XPartyView):    
    def get(self, lesson_code):
        try:
            self.init_user_context("teacher")
            lesson = model_access.get_lesson(lesson_code)
        
            if exceptions.NotAnAuthenticatedTeacherError.check(self.user):
                raise exceptions.NotAnAuthenticatedTeacherError()

            if exceptions.ActivityNotFoundError.check(lesson):
                raise exceptions.ActivityNotFoundError()
            
            if exceptions.WrongPersonError.check(lesson.teacher, self.user):
                raise exceptions.WrongPersonError()

            template_values = {
                'token'              : channel.create_channel(person=self.user, lesson_code=lesson_code),
                'lesson'             : helpers.to_json(lesson.to_dict()),
                'students'           : model_access.get_students(lesson=lesson, as_json=True),
                'task_histories'     : model_access.get_student_actions(lesson=lesson, group_by_task=True, as_json=True)
            }            
            
            teacher_template = self.get_custom_template("teacher", lesson)
            self.write_response_with_template(teacher_template, template_values, custom=True)

        except (exceptions.NotAnAuthenticatedTeacherError, exceptions.WrongPersonError):
            self.redirect_to_teacher_login()

        except exceptions.ActivityNotFoundError:
            self.redirect_with_msg(msg="Lesson not found. Please choose a lesson to continue.", dst="/teacher_dashboard")
