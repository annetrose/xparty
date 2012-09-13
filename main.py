#!/usr/bin/env python

# XParty - A Framework for Building Tools for Learning in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

import webapp2

from AdminPage                  import AdminPage
from ChannelConnectedHandler    import ChannelConnectedHandler
from ChannelDisconnectedHandler import ChannelDisconnectedHandler
from ChannelExpiredHandler      import ChannelExpiredHandler
from DataDump                   import DataDump
from MainPage                   import MainPage
from MessageHandler             import MessageHandler
from StudentInfoHandler         import StudentInfoHandler
from StudentLoginHandler        import StudentLoginHandler
from StudentLoginPage           import StudentLoginPage
from StudentLogout              import StudentLogout
from StudentPage                import StudentPage
from StudentsTimeoutHandler     import StudentsTimeoutHandler
from TaskChangedHandler         import TaskChangedHandler
from TeacherDashboard           import TeacherDashboard
from TeacherLoginHandler        import TeacherLoginHandler
from TeacherLogout              import TeacherLogout
from TeacherPage                import TeacherPage

from google.appengine.ext.webapp import template
template.register_template_library('customtags.data')

application = webapp2.WSGIApplication(
		[ ('/',                          MainPage),
          ('/admin',                     AdminPage),
		  ('/data_dump',                 DataDump),
          ('/send_message',              MessageHandler),
		  ('/student',                   StudentPage),
          ('/student_info',              StudentInfoHandler),
		  ('/student_login',             StudentLoginPage),
		  ('/student_login_handler',     StudentLoginHandler),
		  ('/student_logout',            StudentLogout),
		  ('/task_changed',              TaskChangedHandler),
          ('/teacher_dashboard',         TeacherDashboard),
		  ('/teacher/([-_A-Za-z0-9]+)',  TeacherPage),
		  ('/teacher_login',             TeacherLoginHandler),
		  ('/teacher_logout',            TeacherLogout),
		  ('/_ah/channel/connected/',    ChannelConnectedHandler),
		  ('/_ah/channel/disconnected/', ChannelDisconnectedHandler),
          ('/channel_expired/([-_A-Za-z0-9]+)', ChannelExpiredHandler),
          ('/students_timeout',          StudentsTimeoutHandler)
		 ], debug=True)

def main():
	application.run()

if __name__ == '__main__':
	main()
