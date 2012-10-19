#!/usr/bin/env python

# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

import webapp2

from server.view.MainPage import MainPage
from server.view.AdminPage import AdminPage
from server.view.StudentLoginPage import StudentLoginPage
from server.view.StudentPage import StudentPage
from server.view.TeacherDashboardPage import TeacherDashboardPage
from server.view.TeacherPage import TeacherPage
from server.api.StudentInfoHandler import StudentInfoHandler
from server.api.StudentLoginHandler import StudentLoginHandler
from server.api.StudentLogoutHandler import StudentLogoutHandler
from server.api.StudentMessageHandler import StudentMessageHandler
from server.api.TeacherActivityHandler import TeacherActivityHandler
from server.api.TeacherLoginHandler import TeacherLoginHandler
from server.api.TeacherLogoutHandler import TeacherLogoutHandler
from server.api.ChannelConnectedHandler import ChannelConnectedHandler
from server.api.ChannelDisconnectedHandler import ChannelDisconnectedHandler
from server.api.ChannelExpiredHandler import ChannelExpiredHandler

from google.appengine.ext.webapp import template
template.register_template_library('server.view.templates.customtags.library')

application = webapp2.WSGIApplication([ 
    # views
    ('/',                          MainPage),
    ('/admin',                     AdminPage),
    ('/student_login',             StudentLoginPage),
    ('/student',                   StudentPage),
    ('/teacher_dashboard',         TeacherDashboardPage),
    ('/teacher/([-_A-Za-z0-9]+)',  TeacherPage),  
    
    # apis
    ('/student_info',              StudentInfoHandler),
	('/student_login_handler',     StudentLoginHandler),
	('/student_logout',            StudentLogoutHandler),
    ('/student_message',           StudentMessageHandler),
    ('/teacher_activity',          TeacherActivityHandler),
	('/teacher_login',             TeacherLoginHandler),
	('/teacher_logout',            TeacherLogoutHandler),
	('/_ah/channel/connected/',    ChannelConnectedHandler),
	('/_ah/channel/disconnected/', ChannelDisconnectedHandler),
    ('/channel_expired/([-_A-Za-z0-9]+)', ChannelExpiredHandler),
], debug=True)

def main():
	application.run()

if __name__ == '__main__':
	main()
