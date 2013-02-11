/*
# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn -- www.alexquinn.org
#          Anne Rose -- www.cs.umd.edu/hcil/members/arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0
*/

TODO: Finish writing instructions

HOW TO CREATE A CUSTOM STUDENT VIEW FOR AN ACTIVITY TYPE

* Create an html file in server/view/custom_templates named student_xxx.html 
  where xxx is the activity type. Use underscores instead of spaces in xxx 
  (no other special characters allowed).
  
  {% block custom_head %} should load any custom javascript, css, etc.
  {% block task_gui %} should load the UI for a task.
  
* Create a javascript file in client/custom/xxx/js named student_xxx.js
  where xxx is the activity type.  Load js in student_xxx.html.
  
  (Optional) Implement initCustomUI().
  (Optional) Implement initCustomTaskUI().
  (Optional) Implement initCustomData() to initialize any custom data structures.
  (Optional) Implement onStudentActionComplete().


HOW TO CREATE A CUSTOM TEACHER VIEW FOR AN ACTIVITY TYPE

* Create an html file in server/view/custom_templates named teacher_xxx.html 
  where xxx is the activity type. Use underscores instead of spaces in xxx 
  (no other special characters allowed).
  
  {% block custom_head %} should load any custom javascript, css, etc.
  
* Create a javascript file in client/custom/xxx/js named teacher_xxx.js
  where xxx is the activity type. Load js in teacher_xxx.html.
  
  (Optional) Implement defineCustomPanes() to define any custom data panes.

  To add a custom data pane, add a DataPane to the global array gDataPanes.
  Extend DataPane or ActionPane to create your own DataPane object.
  Refer to client/custom/js/teacher_*.js for examples.

  By default all teacher views include:
  - a StudentPane that contains a list of all students and their actions
  - a HistoryPane that contains a complete history of all actions

  (Optional) Implement defineCustomActionDescriptions(action) to define html displayed in action histories.
  By default, action.action_description is used.

  (Optional) Implement initCustomData() to initialize any custom data structures.