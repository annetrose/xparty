# XParty - A Framework for Building Tools for Learning in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

import webapp2

class StudentsTimeoutHandler(webapp2.RequestHandler):
    def get(self):
        from model import Student
        import datetime
        import settings

        students = tuple(Student.all().filter("latest_logout_timestamp =", None))
        for student in students:
            if datetime.datetime.now() > student.latest_login_timestamp + settings.STUDENT_SESSION_TIMEOUT:
                student.log_out(True)
                from helpers import log
                log('=> LOGGED OUT {0} FROM LESSON {1} BECAUSE SESSION TIMED OUT'.format(student.nickname,student.lesson.lesson_code))



