# XParty - A Framework for Building Tools for Learning in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

import webapp2

class XPartyRequestHandler(webapp2.RequestHandler):

    def load_xparty_context(self, user_type):
        from gaesessions import get_current_session
        from helpers import log
        
        try:
            # Get the current browser session, if any.  Otherwise, create one.
            self.session = get_current_session()
                            
            if self.session.sid is None:
                self.session.start()
                log("=> CREATE NEW SESSION: {0}".format(self.session.sid))
            assert self.session.sid is not None
                 
            person = None
                           
            if user_type in ("student", "unknown"):
            # Might be a student
                person = self._attempt_to_identify_as_student()
                if person is not None:
                    log("=> STUDENT FOUND")

            if person is None and user_type in ("teacher", "unknown"):
            # Not found yet and might be a teacher
                person = self._attempt_to_identify_as_teacher()
                if person is not None:
                    log("=> TEACHER FOUND")

            self.set_person(person)  # Pass None, if no student or teacher record was found.
            
        finally:
            pass

    def _attempt_to_identify_as_student(self):
        from model import Student
        from helpers import log
        
        # Initialize student
        # We still store changes to student record only, if any, but we don't want to store
        # the record needlessly, since that consumes billable resources.
        student = None
        student_is_dirty = False

        # There are two ways to identify a student: nickname + lesson code sent via CGI,
        # or the session ID.  We will try them in that order.

        # Get CGI form values
        lesson_code = self.request.get("lesson_code", None)
        student_nickname = self.request.get("student_nickname", None)
        if lesson_code is not None and student_nickname is not None:
        # 1. Fetch student by nickname+lesson
            student_nickname = self.htmlunquote(student_nickname)
            key_name = Student.make_key_name(student_nickname=student_nickname, lesson_code=lesson_code)
            student = Student.get_by_key_name(key_name)
            log("=> SEARCHING BY NAME AND LESSON CODE: {0}, {1}, {2}".format(student_nickname, lesson_code, key_name))
                
            if student is not None and self.session.sid != student.session_sid:
                if student.is_logged_in:
                # Prevent login if student already logged in to another session
                # GAE limits # of channels so we don't want to allow too many student windows
                    from all_exceptions import StudentLoginException
                    raise StudentLoginException("Please choose another name.  Someone is already logged in as %s."%\
                        (student_nickname.encode("ascii","xmlcharrefreplace")),
                        "Session ID doesn't match.", student.session_sid, self.session.sid,
                        student.latest_login_timestamp, student.latest_logout_timestamp)
                
#                else:
#                # Need to update session id if student was logged into another browser previously (and then logged out)
#                    student.session_sid = self.session.sid
#                    student_is_dirty = True
                                    
        else:       
        # 2. Fetch student by session id             
            student = Student.all().filter("session_sid =", self.session.sid).get()
            log("=> SEARCHING FOR STUDENT BY SESSION ID {0}".format(self.session.sid))
            
            if student is not None and not student.is_logged_in:
            # Passively log student in again.
            # At some point this student logged into this browser but logged out passively.
                from datetime import datetime
                student.latest_login_timestamp = datetime.now()
                student.latest_logout_timestamp = None
                student_is_dirty = True
                log("=> PASSIVE STUDENT LOGIN AFTER PASSIVE LOGOUT")
                                  
        if student_is_dirty:
        # Store changes to student record, if any.
            student.put()
          
        if student is not None and not student.is_logged_in:
            log("=> STUDENT IS **NOT** LOGGED IN")
            
        return student

    def _attempt_to_identify_as_teacher(self):
        from model import Teacher
        from google.appengine.api import users

        self.user = users.get_current_user()  # authenticated Google user
        authenticated_google_user = self.user

        # Teacher is identified solely by their Google account.  If they're logged into
        # the Google account, then they're logged into XParty.

        if authenticated_google_user is None:
            teacher = None
        else:
            teacher = Teacher.get_by_key_name(authenticated_google_user.user_id())

        return teacher
    
    def set_person(self, person):
        # Pass None to this method to indicate that no student or teacher was recognized.
        self.person = person

        from model import Teacher, Student
        if isinstance(person, Student):
            self.person_type = "student"
        elif isinstance(person, Teacher):
            self.person_type = "teacher"
        else:
            self.person_type = "unknown"
            
    @property
    def is_student(self):
        return self.person is not None and self.person_type == "student"
    
    @property
    def is_teacher(self):
        return self.person is not None and self.person_type == "teacher"

    @property
    def student_key(self):
        if not self.is_student:
            return None
        else:
            return self.person.key()

    @property
    def teacher_key(self):
        if not self.is_teacher:
            return None
        else:
            return self.person.key()
                    
    def create_channel(self, person_key, lesson_code):
        from google.appengine.api import channel
        import client_id_utils
        from helpers import log
        client_id = client_id_utils.create_client_id(person_type=self.person_type, person_key=person_key, lesson_code=lesson_code)
        token = channel.create_channel(client_id)
        log("=> CHANNEL CREATED for {0} on {1}.".format(self.person, client_id))
        return token

    def gen_header(self, role="unknown"):
        from google.appengine.api import users
        assert role in ("teacher", "student", "unknown")
        template_vals = {"nickname":None, "teacher_login_url":None, "role":role}
        if self.person is None or self.person_type == "unknown":
            template_vals["is_logged_in"] = False
            template_vals["teacher_login_url"] = users.create_login_url("/teacher_login")
        else:
            template_vals["is_logged_in"] = True
            template_vals["nickname"] = self.person.nickname
            template_vals["displayname"] = "Anonymous" if self.is_student and self.person.anonymous else self.person.nickname
        html = self.render_template("header.html", template_vals)
        return html

    def write_response_with_template(self, template_filename, template_vals):
        html = self.render_template(template_filename=template_filename, template_vals=template_vals)
        self.response.out.write(html)

    def render_template(self, template_filename, template_vals):
        from google.appengine.ext.webapp import template
        # This page says "webapp" should still be used:
        # http://webapp-improved.appspot.com/tutorials/gettingstarted/templates.html
        import os
        path = os.path.join(os.path.dirname(__file__), 'templates', template_filename)
        html = template.render(path, template_vals)
        return html
                
    def write_response_plain_text(self, s):
        if not isinstance(s, basestring):
            s = unicode(s)
        self.response.headers["Content-Type"] = "text/plain"
        self.response.out.write(s)

    def write_response_as_file(self, encoded_content, content_type, filename, encoding):
        # Filename may consist of only letters, numbers, period, underscore, and hyphen.

        import re
        assert re.match(r"^[-_.a-zA-Z0-9]+$", filename) is not None, repr(filename)

        if encoding is not None:
            content_type += "; charset=%s"%encoding

        self.response.headers["Content-Type"] = content_type
        self.response.headers["Content-Disposition"] = 'attachment; filename="%s"'%filename
        self.response.out.write(encoded_content)
        
    def clear_session(self):
        self.session.terminate()
        self.session.clear()
        self.session.regenerate_id()

    def clear_session_and_redirect(self, dst):
        # TODO:  Find out if we should we call session.terminate() here.
        #        Ben did before.  Alex doesn't think it's necessary but he's not 100% sure.
        self.clear_session()
        self.redirect(dst)
        
    def redirect_to_teacher_login(self, dst=None):
        from google.appengine.api import users
        login_url = '/teacher_login'
        if dst is not None:
            login_url += '?page='+dst
        self.redirect(users.create_login_url(login_url))

    def redirect_with_msg(self, msg, dst='/'):
        self.session['msg'] = msg
        self.redirect(dst)
        
    def get_lessons(self, returnAll=False):
        from model import Lesson   
        lessons = None 
        if returnAll:
            lessons = Lesson.fetch_all(sort="title")  
        elif self.person is not None and self.is_teacher:   
            lessons = Lesson.fetch_all(filter_expr="teacher", filter_value=self.person, sort="title")   
        return lessons

    def get_students(self, lesson):
        from model import Student
        students = None
        if self.person is not None and self.is_teacher:
            students = Student.fetch_all(filter_expr="lesson", filter_value=lesson, sort="nickname")
        return students
        
    def htmlunquote(self, html):
        html = html.replace("&quot;", '"')
        html = html.replace("&#39;", "'")
        html = html.replace("&gt;", ">")
        html = html.replace("&lt;", "<")
        html = html.replace("&amp;", "&")
        return html
