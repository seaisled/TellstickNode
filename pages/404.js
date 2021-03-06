exports.get = get;

function get(request, response) {
  // Include the template view (Do all the presentation(?))
  var template = require('../templates/template-main');

  // Define the different parts of the page.
  var headline = 'Not Found';
  var body = ['<div class="panel panel-default">',
    '<div class="panel-body">',
    'Unable to find the page you requested.',
    '</div>',
    '</div>',
  ];

  // Join each row of the body array to a continious string with proper row endings.
  body = body.join("\n");
  response.status(404).send(template.build(headline, body, false));
}