# XParty - A Framework for Building Tools for Learning in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from XPartyRequestHandler import XPartyRequestHandler

class TeacherPage(XPartyRequestHandler):
    def get(self, lesson_code):
        self.load_xparty_context(user_type="teacher")

        try:            
            if not self.is_teacher:
                raise NotAnAuthenticatedTeacherError()

            from model import Lesson
            lesson = Lesson.get_by_key_name(lesson_code)
            if lesson is None:
                raise LessonNotFoundError()
            if lesson.teacher_key != self.teacher_key:
                raise WrongTeacherError()

            teacher = self.person
            person_key = teacher.user.user_id();
            token = self.create_channel(person_key=person_key, lesson_code=lesson_code)

            from model import get_lesson_activities
            template_values = {
                'header'             : self.gen_header("teacher"),
                'token'              : token,
                'lesson'             : lesson,
                'students'           : self.get_students(lesson),
                'task_histories'     : get_lesson_activities(lesson=lesson, asJson=True)
            }

            if self.session.has_key('msg'):
                template_values['msg'] = self.session.pop('msg')  # only show the message once

            self.write_response_with_template("teacher.html", template_values)

        except NotAnAuthenticatedTeacherError:
            self.redirect_to_teacher_login()

        except LessonNotFoundError:
            self.redirect_with_msg("There was an internal error.  Please choose your lesson to continue.", "/teacher_dashboard")

        except WrongTeacherError:
            self.redirect_to_teacher_login()

class WrongTeacherError(Exception): pass
class LessonNotFoundError(Exception): pass
class NotAnAuthenticatedTeacherError(Exception): pass   
