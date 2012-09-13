# XParty - A Framework for Building Tools for Learning in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

import datetime

DEBUG = False
try:
	# Set to debug mode only when running in the development server.
	import os
	if os.environ["SERVER_SOFTWARE"].startswith("Development"):
		DEBUG = True
except:
	pass

ENABLE_DEBUG_LOGGING = DEBUG
ENABLE_FILLER_FORM_FILLING = DEBUG
CHANNEL_LIMIT_PER_STUDENT = 1
STUDENT_SESSION_TIMEOUT = datetime.timedelta(days = 1);
