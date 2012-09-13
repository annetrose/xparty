# XParty - A Framework for Building Tools for Learning in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from XPartyRequestHandler import XPartyRequestHandler

class MainPage(XPartyRequestHandler):
	def get(self):
		self.load_xparty_context(user_type="unknown")

		if self.is_teacher:   # Teacher logged in
			self.redirect_with_msg(msg="", dst="/teacher_dashboard")

		elif self.is_student: # Student logged in
			self.redirect_with_msg(msg="", dst="/student")

		else:
			template_values = { 'header': self.gen_header() }
			if self.session.has_key('msg'):
				template_values['msg'] = self.session.pop('msg')  # only show the message once
			self.write_response_with_template("index.html", template_values)
