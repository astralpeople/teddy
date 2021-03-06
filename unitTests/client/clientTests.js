// @param verbosity
// Possible values: none, concise (default), verbose, DEBUG
teddy.setVerbosity('concise');

var templateList = [
  'test.html',
  'inc/headerfooter.html',
  'inc/sampleIncludeWithArguments.html',
  'inc/sampleIncludeWithoutArguments.html'
],

model = {
  letters: ['a', 'b', 'c'],
  names: {jack: 'guy', jill: 'girl', hill: 'landscape'},
  objects: [{a:1, b:2, c:3}, {a:4, b:5, c:6}, {a:7, b:8, c:9}],
  objectOfObjects: {one: {a:1, b:2, c:3}, two:{a:4, b:5, c:6}, three:{a:7, b:8, c:9}},
  something: 'Some content',
  somethingElse: true,
  variableName: 'Hello world!',
  varWithVarInside: 'Variable with a variable inside: {subVar}',
  subVar: 'And another: {variableName}',
  pageTitle: 'Teddy Templating Engine unit tests',
  dynamicInclude: 'sampleIncludeWithoutArguments',
  escapeTest: '<span>raw html</span>'
},

// utility vars
i,
template,
request = new XMLHttpRequest(),
renderedTemplate = '',
sameOriginPolicy,
oldIE,
idoc, // this is not an Ultima Online reference ;)

// makes HTML readable
escapeHTMLEntities = function(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
},

// unit tester function
unitTest = function(testName, testFunc) {
  try {
    if (testFunc()) {
      document.body.insertAdjacentHTML('beforeend', '<p class="pass">PASS: '+testName+'</p>');
    }
    else {
      document.body.insertAdjacentHTML('beforeend', '<p class="fail">FAIL: '+testName+'</p>');
    }
  }
  catch (e) {
    document.body.insertAdjacentHTML('beforeend', '<p class="fail">FAIL: '+testName+' JS Error: '+e+'</p>');
  }
};

// fetch and compile the templates
for (i in templateList) {
  template = templateList[i];
  try {
    request.open('GET', '../testTemplates/' + template, false);
    request.send(); // because of "false" above, the send method will block until the request is finished
    teddy.compile(request.response, template);
  }
  catch (e) {
    document.body.insertAdjacentHTML('beforeend', "<h2>Warning: these tests can only be run from a web server.</h2><p>Due to the <a href='http://en.wikipedia.org/wiki/Same_origin_policy'>same origin policy</a> applying to files loaded directly from the local filesystem, these unit tests can only be executed from a real HTTP server.</p><p>To start a simple web server to run these tests with, open your terminal and run this command from the \"teddy\" directory:</p><pre>python -m SimpleHTTPServer</pre><p>Then simply visit <a href='http://localhost:8000/unitTests/client/clientTests.html'>http://localhost:8000/unitTests/client/clientTests.html</a></p><p>If you can't run the command, then you'll need to <a href='http://www.python.org/'>install Python</a> or use some other web server.</p>");
    sameOriginPolicy = true;
    break;
  }
}

// test for old IE
oldIE = document.createElement('p');
oldIE.innerHTML = '<!--[if lte IE 9]><i></i><![endif]-->';
oldIE = oldIE.getElementsByTagName('i').length === 1 ? true : false;

if (!sameOriginPolicy && !oldIE) {

  // render template
  renderedTemplate = teddy.render('test.html', model);

  // begin unit test output
  document.body.insertAdjacentHTML('beforeend', '<h2>Running unit tests...</h2><p>Test results will appear below... here we go!</p>');

  // show compiled template
  document.body.insertAdjacentHTML('beforeend', '<h2>Unrendered compiled template:</h2><pre class="prettyprint lang-html">'+escapeHTMLEntities(vkbeautify.xml(teddy.compiledTemplates['test.html']))+'</pre>');

  // show data model
  document.body.insertAdjacentHTML('beforeend', '<h2>Data model applied to it:</h2><pre class="prettyprint lang-js">'+JSON.stringify(model, null, '\t')+'</pre>');

  // show fully rendered html
  document.body.insertAdjacentHTML('beforeend', '<h2>Fully rendered resulting HTML:</h2><pre class="prettyprint lang-html">'+escapeHTMLEntities(vkbeautify.xml(renderedTemplate))+'</pre>');

  // run prettify.js to syntax highlight the above code
  prettyPrint();

  // render fully rendered html into an iframe
  document.body.insertAdjacentHTML('beforeend', '<h2>Rendered in an iframe:</h2>');
  i = document.createElement('iframe');
  document.body.appendChild(i);
  idoc = i.contentWindow.document;
  idoc.open();
  idoc.write(renderedTemplate);
  idoc.close();

  // run unit tests on rendered output
  document.body.insertAdjacentHTML('beforeend', '<h2>Test case results:</h2>');

  // test list
  // NOTE: the replace on the xmlns stuff is a hack to work around Firefox and IE dumping that attribute everywhere

  unitTest('&lt;title&gt; tag test', function() {
    return idoc.getElementsByTagName('title')[0].innerHTML.replace(/ xmlns=\"http:\/\/www.w3.org\/1999\/xhtml\"/g, '') == 'Teddy Templating Engine unit tests' ? true : false;
  });

  unitTest('&lt;style&gt; tag test', function() {
    return idoc.getElementsByTagName('style')[0].innerHTML.replace(/ xmlns=\"http:\/\/www.w3.org\/1999\/xhtml\"/g, '') == ' body{font-family: monospace;} ' ? true : false;
  });

  unitTest('{variable} test', function() {
    return idoc.getElementsByClassName('variables')[0].innerHTML.replace(/ xmlns=\"http:\/\/www.w3.org\/1999\/xhtml\"/g, '') == ' <h1>Simple variable</h1> <p>Hello world!</p> <h2>Variable with a variable in it</h2> <p>Variable with a variable inside: And another: Hello world!</p> ' ? true : false;
  });

  unitTest('{variable} escape test', function() {
    return idoc.getElementsByClassName('varEscaping')[0].innerHTML.replace(/ xmlns=\"http:\/\/www.w3.org\/1999\/xhtml\"/g, '') == ' <p>&lt;span&gt;raw html&lt;/span&gt;</p> <p><span>raw html</span></p> ' ? true : false;
  });

  unitTest('{! server-side comment !} test', function() {
    return (idoc.body.innerHTML.indexOf('{!') > -1 || idoc.body.innerHTML.indexOf('!}') > -1) ? false : true;
  });

  unitTest('&lt;!-- HTML comment --&gt; test', function() {
    return (idoc.body.innerHTML.indexOf('<!-- HTML comment; is sent to the client -->') > -1) ? true : false;
  });

  unitTest('&lt;include&gt; without arguments test', function() {
    return idoc.getElementsByClassName('sampleIncludeWithoutArguments')[0].innerHTML.replace(/ xmlns=\"http:\/\/www.w3.org\/1999\/xhtml\"/g, '') == ' <p>This is a sample included template without arguments.</p>' ? true : false;
  });

  unitTest('&lt;include&gt; with arguments test', function() {
    return idoc.getElementsByClassName('sampleIncludeWithArguments')[0].innerHTML.replace(/ xmlns=\"http:\/\/www.w3.org\/1999\/xhtml\"/g, '') == ' <p>This is a sample included template with arguments.</p> <dl> <dt>firstArgument:</dt> <dd>Plain text argument</dd> <dt>secondArgument:</dt> <dd> <span>Argument with HTML in it</span> </dd> <dt>thirdArgument: </dt> <dd>Plain text argument to be checked via an if statement</dd> </dl>' ? true : false;
  });

  unitTest('&lt;includes&gt; overall test', function() {
    return idoc.getElementsByClassName('includes')[0].innerHTML.replace(/ xmlns=\"http:\/\/www.w3.org\/1999\/xhtml\"/g, '') == ' <h1>Includes</h1> <section class="sampleIncludeWithoutArguments"> <p>This is a sample included template without arguments.</p></section> <section class="sampleIncludeWithArguments"> <p>This is a sample included template with arguments.</p> <dl> <dt>firstArgument:</dt> <dd>Plain text argument</dd> <dt>secondArgument:</dt> <dd> <span>Argument with HTML in it</span> </dd> <dt>thirdArgument: </dt> <dd>Plain text argument to be checked via an if statement</dd> </dl></section> ' ? true : false;
  });

  unitTest('conditionals overall test', function() {
    return idoc.getElementsByClassName('flowcontrol')[0].innerHTML.replace(/ xmlns=\"http:\/\/www.w3.org\/1999\/xhtml\"/g, '') == " <h1>Flow control</h1> <p>The variable 'something' is present</p> <p>The variable 'something' is not set to 'hello'</p> <p>The variable 'something' is present</p> <p>The variable 'something' is present</p> <p>The variables 'something' and 'somethingElse' are both present</p> " ? true : false;
  });

  unitTest('boolean logic test', function() {
    return idoc.getElementsByClassName('booleanLogic')[0].innerHTML.replace(/ xmlns=\"http:\/\/www.w3.org\/1999\/xhtml\"/g, '') == " <p>or: true</p> <p>and: false</p> <p>xor: false</p> <p>not: false</p> <p>and + or: true</p> " ? true : false;
  });

  unitTest('one line if test', function() {
    return idoc.getElementsByClassName('onelineifs')[0].innerHTML.replace(/ xmlns=\"http:\/\/www.w3.org\/1999\/xhtml\"/g, '') == ' <h1>One line ifs</h1> <p class="something-is-present">One line if.</p> <p class="something-is-not-hello">One line if.</p> ' ? true : false;
  });

  unitTest('loops overall test', function() {
    return idoc.getElementsByClassName('looping')[0].innerHTML.replace(/ xmlns=\"http:\/\/www.w3.org\/1999\/xhtml\"/g, '') == " <h1>Looping</h1> <dl> <dt>JS model:</dt> <dd>letters = ['a', 'b', 'c'];</dd> <dt>HTML template:</dt> <dd> <p>a</p> <p>b</p> <p>c</p> </dd> </dl> <dl> <dt>JS model:</dt> <dd>names = {jack: 'guy', jill: 'girl', hill: 'landscape'};</dd> <dt>HTML template:</dt> <dd> <p>jack</p> <p>guy</p> <p>jill</p> <p>girl</p> <p>hill</p> <p>landscape</p> </dd> </dl> <dl> <dt>JS model:</dt> <dd>objects = [{a:1, b:2, c:3}, {a:4, b:5, c:6}, {a:7, b:8, c:9}];</dd> <dt>HTML template:</dt> <dd> <p>0</p> <p>1</p> <p>2</p> <p>3</p> <p>1</p> <p>4</p> <p>5</p> <p>6</p> <p>2</p> <p>7</p> <p>8</p> <p>9</p> </dd> </dl> <dl> <dt>JS model:</dt> <dd>objects = [{a:1, b:2, c:3}, {a:4, b:5, c:6}, {a:7, b:8, c:9}];</dd> <dt>HTML template:</dt> <dd> <p hidden=\"\">item.b is 5</p> <section class=\"sampleIncludeWithArguments\"> <p>This is a sample included template with arguments.</p> <dl> <dt>firstArgument:</dt> <dd>2</dd> <dt>secondArgument:</dt> <dd> <span>3</span> </dd> <dt>thirdArgument: </dt> <dd>not present</dd> </dl></section> <p>item.a is 4</p> <p class=\"item-b-is-five\">item.b is 5</p> <section class=\"sampleIncludeWithArguments\"> <p>This is a sample included template with arguments.</p> <dl> <dt>firstArgument:</dt> <dd>5</dd> <dt>secondArgument:</dt> <dd> <span>6</span> </dd> <dt>thirdArgument: </dt> <dd>not present</dd> </dl></section> <p hidden=\"\">item.b is 5</p> <section class=\"sampleIncludeWithArguments\"> <p>This is a sample included template with arguments.</p> <dl> <dt>firstArgument:</dt> <dd>8</dd> <dt>secondArgument:</dt> <dd> <span>9</span> </dd> <dt>thirdArgument: </dt> <dd>not present</dd> </dl></section> </dd> </dl> " ? true : false;
  });

  unitTest('looping through nested object test', function() {
    return idoc.getElementsByClassName('nestedObjectLoops')[0].innerHTML.replace(/ xmlns=\"http:\/\/www.w3.org\/1999\/xhtml\"/g, '') == " <p>a: 4</p> <p>b: 5</p> <p>c: 6</p> " ? true : false;
  });

  unitTest('inline tag whitespace test', function() {
    return idoc.getElementsByClassName('inlineTagWhitespace')[0].innerHTML.replace(/ xmlns=\"http:\/\/www.w3.org\/1999\/xhtml\"/g, '') == " <p><span>Hello</span> <span>world</span></p> " ? true : false;
  });

  unitTest('table test', function() {
    return idoc.getElementsByClassName('tableTest')[0].innerHTML.replace(/ xmlns=\"http:\/\/www.w3.org\/1999\/xhtml\"/g, '') == " <table> <caption>Sample Table - High Scores</caption> <thead> <tr> <th>#</th> <th>Name</th> <th>Score</th> </tr> </thead> <tfoot> <tr> <th>#</th> <th>Name</th> <th>Score</th> </tr> </tfoot> <tbody> <tr> <td>0</td> <td>player <strong>a</strong></td> <td>over 9000!</td> </tr> <tr> <td>1</td> <td>player <strong>b</strong></td> <td>over 9000!</td> </tr> <tr> <td>2</td> <td>player <strong>c</strong></td> <td>over 9000!</td> </tr> </tbody> </table> " ? true : false;
  });

  unitTest('text node-only element test', function() {
    var output = idoc.getElementsByClassName('textNodeElementTest')[0].innerHTML.replace(/ xmlns=\"http:\/\/www.w3.org\/1999\/xhtml\"/g, '');
    return  output == " <script>/* `something` present */ </script> <textarea name=\"textareaTest\" rows=\"9\" cols=\"9\">something </textarea> <select name=\"selectTest\"> <option value=\"something\">something</option> </select> " ||
            output == " <script> /* `something` present */ </script> <textarea name=\"textareaTest\" rows=\"9\" cols=\"9\"> something </textarea> <select name=\"selectTest\"> <option value=\"something\">something</option> </select> " ? true : false;
  });

  unitTest('dynamic includes and conditionals test', function() {
    return idoc.getElementsByClassName('dynamicInclude')[0].innerHTML.replace(/ xmlns=\"http:\/\/www.w3.org\/1999\/xhtml\"/g, '') == ' <section class="sampleIncludeWithoutArguments"> <p>This is a sample included template without arguments.</p></section> ' ? true : false;
  });

  unitTest('packaged templates test', function() {
    if (teddy.packagedTemplates['inc/sampleIncludeWithArguments.html'] !== "teddy.compiledTemplates['inc/sampleIncludeWithArguments.html']='<section class=\\'sampleIncludeWithArguments\\'> <p>This is a sample included template with arguments.</p> <dl> <dt>firstArgument:</dt> <dd>{firstArgument}</dd> <dt>secondArgument:</dt> <dd>{secondArgument}</dd> <dt>thirdArgument: </dt> <if thirdArgument> <dd>{thirdArgument}</dd> </if> <else> <dd>not present</dd> </else> </dl></section>';" || teddy.packagedTemplates['inc/sampleIncludeWithoutArguments.html'] !== "teddy.compiledTemplates['inc/sampleIncludeWithoutArguments.html']='<section class=\\'sampleIncludeWithoutArguments\\'> <p>This is a sample included template without arguments.</p></section>';") {
      return false;
    }
    try {
      eval(teddy.packagedTemplates['inc/sampleIncludeWithArguments']);
      eval(teddy.packagedTemplates['inc/sampleIncludeWithoutArguments']);
      return true;
    }
    catch (e) {
      console.log(e);
      return false;
    }
  });
}