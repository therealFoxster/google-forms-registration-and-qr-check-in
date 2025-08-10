function errorPage(title, message) {
  return page(title, '❌', message, '#dc3545');
}

function successPage(title, message) {
  return page(title, '✅', message, '#28a745');
}

function page(title, icon, subtitle, color) {
  let template = HtmlService.createTemplateFromFile('status');
  template.data = {
    title: title,
    icon: icon,
    subtitle: subtitle,
    color: color
  };
  return template
    .evaluate()
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setTitle(title);
}