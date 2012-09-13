# XParty - A Framework for Building Tools for Learning in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from XPartyRequestHandler import XPartyRequestHandler

class StudentLoginHandler(XPartyRequestHandler):
    INITIAL_TASK_IDX = 0

    def post(self):
        import json
        from model import Student, Lesson
        from all_exceptions import StudentLoginException
        from datetime import datetime
        from helpers import log

        try:
            self.load_xparty_context(user_type="student")

            # Get CGI form fields.
            lesson_code = self.request.get('lesson_code')
            student_nickname = self.request.get('student_nickname')
            ext = int(self.request.get('ext', 0))

            # Normalize whitespace in student name.
            # Replace any string of >=1 whitespace with a single space (equivalent to s/\s+/ /g).
            student_nickname = " ".join(student_nickname.split())

            if not lesson_code:
            # No lesson code
                raise StudentLoginException("Please enter a lesson code.",
                        "lesson_code==%r"%lesson_code)
                
            # If no student nickname, generate an anonymous one
            anonymous = False
            if not student_nickname:
                import random, string
                alphabet = string.letters + string.digits

                anonymous_student = None
                for i in range(8):
                    random_nickname = "".join(random.choice(alphabet) for i in range(10))
                    key_name = Student.make_key_name(student_nickname=random_nickname, lesson_code=lesson_code)
                    anonymous_student = Student.get_by_key_name(key_name)
                    if anonymous_student is None:
                        student_nickname = random_nickname
                        anonymous = True
                        break
    
            if anonymous and not student_nickname:
            # No student name
                raise StudentLoginException("Could not login as anonymous student.",
                        "student_nickname==%r"%student_nickname)

#            if not lesson_code and not student_nickname:
#            # Blank form
#                raise StudentLoginException("Please enter a lesson code and a student name.",
#                        "lesson_code==%r, student_nickname==%r"%(lesson_code, student_nickname))
#            elif not lesson_code:
#            # No lesson code
#                raise StudentLoginException("Please enter a lesson code.",
#                        "lesson_code==%r"%lesson_code)
#            elif not student_nickname:
#            # No student name
#                raise StudentLoginException("Please enter a student name.",
#                        "student_nickname==%r"%student_nickname)

            lesson = Lesson.get_by_key_name(lesson_code)
            # Retrieve lesson from DB
            # - If lesson does not exist, this will return None.
            # - If lesson existed but is disabled, it will return the lesson, but lesson.is_active will be False.
            # - If lesson existed but was deleted (hidden), it will return the lesson, but lesson.is_deleted will be True.
            #   (Deleting lessons is done lazily.  Actually, they are merely hidden from the teacher's view.)

            if lesson is None or lesson.is_deleted:
            # Lesson does not exist or was deleted (hidden).
                raise StudentLoginException("Please check the lesson code.",
                        "lesson retrieved from datastore with lesson_code %r is None"%lesson_code)
            elif not lesson.is_active:
            # Lesson has been disabled by teacher.  Students are not allowed to work on it anymore.
                raise StudentLoginException("This lesson is finished.  You cannot work on it now.",
                        "lesson_code %r has is_active=False"%lesson_code)
            
            # Fetch student from DB.
            # - Might return None if nobody has ever logged in with this nickname+lesson combination.
            key_name = Student.make_key_name(student_nickname=student_nickname, lesson_code=lesson_code)
            student = Student.get_by_key_name(key_name)
            login_timestamp = datetime.now()

            if student is not None:
            # Found the student.
                student.session_sid=self.session.sid
                student.latest_login_timestamp = login_timestamp
                student.latest_logout_timestamp = None
                if not student.first_login_timestamp:
                    student.first_login_timestamp = login_timestamp

            else:                
                student = Student(
                    key_name=key_name,
                    nickname=student_nickname,
                    teacher=lesson.teacher_key,
                    lesson=lesson,
                    task_idx=self.INITIAL_TASK_IDX,
                    first_login_timestamp=login_timestamp,
                    latest_login_timestamp=login_timestamp,
                    latest_logout_timestamp=None,
                    session_sid=self.session.sid,
                    anonymous=anonymous,
                    client_ids=[]
                )

            assert student.session_sid is not None
            student.put()
            self.set_person(student)
            displayName = "Anonymous" if self.is_student and self.person.anonymous else self.person.nickname
            self.session['msg'] = "Student logged in:  Hello " + displayName
            self.response.headers.add_header('Content-Type', 'application/json', charset='utf-8')
            self.response.out.write(json.dumps({"status":"logged_in", "ext":ext}))
            log( "=> LOGIN SUCCESS" )

        except StudentLoginException, e:
            e.log()
            self.set_person(None)
            msg = e.args[0]
            self.session['msg'] = msg
            self.response.headers.add_header('Content-Type', 'application/json', charset='utf-8')
            self.response.out.write(json.dumps({"status":"logged_out", "error":msg}))
            log( "=> LOGIN FAILURE:  %s"%msg )
