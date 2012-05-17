(function(window) {

    var w = 1280,
    h = 800,
    node,
    link,
    root = {};

var loadedHistory
  , currentFrame
  , interval;

$(document).ready(initControls);

function initControls() {

    var btnLoad = $('#load')
      , controls = $('#controls')
      , btnPlay = $('#play')
      , btnPause = $('#pause')
      , btnNext= $('#next')
      , btnPrevious = $('#previous')
      , inputRepo = $('#repo')
      , inputBranch = $('#branch');

    controls.hide();
    btnPause.hide();

    btnLoad.click(function(e) {
      e.preventDefault();

      pause();
      controls.hide();

      root = { id: 'root', name: '', children: [], contributors: [], commitMsg: 'loading...'};
      update();

      octocom.load(inputRepo.val(), inputBranch.val(), function(history) {
        loadedHistory = history;
        currentFrame = -1;

        controls.show();
        step(1);
      });
    });

    btnPlay.click(function(e) {
      e.preventDefault();

      btnPlay.hide();
      btnPause.show();
      play();
    });

    btnPause.click(function(e) {
      e.preventDefault();

      btnPlay.show();
      btnPause.hide();
      pause();
    });

    btnNext.click(function(e) {
      e.preventDefault();

      btnPlay.show();
      btnPause.hide();
      pause();
      step(1);
    });

    btnPrevious.click(function(e) {
      e.preventDefault();

      btnPlay.show();
      btnPause.hide();
      pause();
      step(-1);
    });
}

function pause() {
  if (interval) clearInterval(interval);
}

function play() {
  interval = setInterval(function() { step(1); }, 2000);
}

function step(i) {

  if (i < 0 && currentFrame + i >= 0) { 
    currentFrame = currentFrame + i;
  } else if (i > 0 && currentFrame + i < loadedHistory.length) {
    currentFrame = currentFrame + i;
  } else {
    return;
  }

  if (currentFrame >= 0 && currentFrame < loadedHistory.length) {
    if (i < 0) {
      function recurse(node) {
        if (node.children) _.each(node.children, function(node) {
          recurse(node); 
        });
        if (!node.children && !node._children) node.status = 'removed';
      }

      recurse(root);
      root = jQuery.extend(true, root, loadedHistory[currentFrame]);
    } else {
      root = jQuery.extend(true, root, loadedHistory[currentFrame]);
    }
    root.fixed = true;
    root.x = w / 2;
    root.y = h / 2 - 80;

    update();
  }
}

var force = d3.layout.force()
    .on('tick', tick)
    .charge(function(d) { return d._children ? -d.size / 100 : -500; })
    .linkDistance(function(d) { return (d.target.children || d.target._children) ? 180 : 30; })
    .size([w, h - 160])
    .friction(0.4);

var vis
  , commitMsg;

$(document).ready(initVis);

function initVis() {
    vis = d3.select('#viz').append('svg:svg')
        .attr('width', w)
        .attr('height', h);

    commitMsg = vis.append('svg:text')
      .attr('class', 'commitMsg')
      .attr('x', 10)
      .attr('y', 10)
      .attr('dy', '.35em')
      .attr('text-anchor', 'start')
      .text('commitMsg: ')
      .style('fill-opacity', 0.7);
}

// d3.json('http://mbostock.github.com/d3/talk/20111116/flare.json', function(json) {
//     console.log(json);
//   root = json;
//   root.fixed = true;
//   root.x = w / 2;
//   root.y = h / 2 - 80;
//   update();
// });

function update() {
  var nodes = flatten(root),
      links = d3.layout.tree().links(nodes);

  // update commit message
  commitMsg.text('commitMag: ' + root.commitMsg);

  // contributors
  var contributors = vis.selectAll(".contributor")
        .data(root.contributors, function(d) { return d.name; });

  var contributorEnter = contributors.enter().append("g")
        .attr("class", "contributor")
        .attr("transform", function(d, i) { return "translate(10," + (h / 2 - i * 20) + ")"; });
  
    contributorEnter.append("text")
        .attr("x", 15)
        .attr("dy", ".35em")
        .text(function(d) { return d.name; });
  
  contributorEnter.append("rect")
     .attr("width", 10)
     .attr("height", 10)
     .attr('y', -5)
     .attr('fill', function(d) { return d.color; });

    contributors.exit().remove();

     // .attr("x", function(d, i) { return x(i) - .5; })
     // .attr("y", function(d) { return h - y(d.value) - .5; })

  // remove links with deleted nodes
  links = _.reject(links, function(link) {
    return link.target.status === 'removed' /*|| link.target.status === 'renamed'*/;
  });

  // Restart the force layout.
  force
      .nodes(nodes)
      .links(links)
      .start();

  // Update the links
  link = vis.selectAll('line.link')
      .data(links, function(d) { return d.target.id; });

  // Enter any new links.
  link.enter().insert('svg:line', '.node')
      .attr('class', 'link')
      .attr('x1', function(d) { return d.source.x; })
      .attr('y1', function(d) { return d.source.y; })
      .attr('x2', function(d) { return d.target.x; })
      .attr('y2', function(d) { return d.target.y; });

  // Exit any old links
  link.exit().remove();

  // Update the nodes
  node = vis.selectAll('g.node')
      .data(nodes, function(d) { return d.id; });

  node.selectAll('circle').transition()
      .attr('r', function(d) { return d.children ? 4.5 : Math.sqrt(d.size)  /*/ 2*/; })
      .style('fill', color);

  // Enter any new nodes.
  var nodeEnter = node.enter().append('svg:g')
      .attr('cx', function(d) { return d.x; })
      .attr('cy', function(d) { return d.y; })
      .attr('class', 'node')
      .on('click', click)
      .call(force.drag);

  var circleNode = nodeEnter.append('svg:circle')
      .attr('r', function(d) { return d.children ? 4.5 : Math.sqrt(d.size) /*/ 2*/; })
      .style('fill', color);

  nodeEnter.append('svg:text')
      .attr('x', 10)
      .attr('dy', '.35em')
      .attr('text-anchor', function(d) { return d.children || d._children ? 'end' : 'start'; })
      .text(function(d) { return d.name; })
      .style('fill-opacity', 0.7);

  // Exit any old nodes.
  node.exit().remove();
}

function tick() {
  link.attr('x1', function(d) { return d.source.x; })
      .attr('y1', function(d) { return d.source.y; })
      .attr('x2', function(d) { return d.target.x; })
      .attr('y2', function(d) { return d.target.y; });

  // svg:g has no cx/cy so translate it to position
  node.attr('transform', function(d) { return 'translate(' + d.x + ',' + d.y + ')'; });
  // node.attr('cx', function(d) { return d.x; })
  //     .attr('cy', function(d) { return d.y; });
}

// Color leaf nodes orange, and packages white or blue.
function color(d) {
  return d._children ? '#3182bd' : d.children ? '#c6dbef' : d.color;
}

// Toggle children on click.
function click(d) {
  if (d.children) {
    d._children = d.children;
    delete d.children;
  } else {
    d.children = d._children;
    delete d._children;
  }
  update();
}

// Returns a list of all nodes under the root.
function flatten(root) {
  var nodes = [], i = 0;

  var parent = root;
  function recurse(node) {
    if (node.children) node.size = node.children.reduce(function(p, v) { 
      parent = node; 
      return p + recurse(v); 
    }, 0);
    if (!node.id) node.id = ++i;
    if (!node.x) node.x = parent.x + Math.ceil(Math.random() * 50);
    if (!node.y) node.y = parent.y + Math.ceil(Math.random() * 50);
    if (node.status !== 'removed' /*&& node.status !== 'renamed'*/) nodes.push(node); // theres yet no way to get the previous name of a renamed or moved file as status is renamed with new filename
    return node.size;
  }

  root.size = recurse(root);
  return nodes;
}

}(this));