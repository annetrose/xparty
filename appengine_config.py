# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0


# suggestion: generate your own random key using os.urandom(64).encode('hex')
# WARNING: Make sure you run os.urandom(64) OFFLINE and copy/paste the output to
# this file.  If you use os.urandom() to *dynamically* generate your key at
# runtime then any existing sessions will become junk every time you start,
# deploy, or update your app!
COOKIE_KEY = '1fedb8b8ea2f341b86eb5d8c15241d41c4b9d9776b96337cf927598eb1dda7fc5d7b4b6fc33c7689e7825a7712cadbec492898481016995af7aafabc78b6e54f'

# Silence warnings about Django
# http://code.google.com/appengine/docs/python/tools/libraries.html#Django
#os.environ['DJANGO_SETTINGS_MODULE'] = 'dummy_django_settings'
#from google.appengine.dist import use_library
#use_library('django', '1.2')

def webapp_add_wsgi_middleware(app):
	from server.lib.gaesessions import SessionMiddleware
	from google.appengine.ext.appstats import recording
	app = SessionMiddleware(app, cookie_key=COOKIE_KEY)
	app = recording.appstats_wsgi_middleware(app)
	return app
