var _ = require("./lodash");
var d3 = require("./d3");
var layout = require("./dagre").layout;


module.exports = render;

// This design is based on http://bost.ocks.org/mike/chart/.
function render() {
  var createNodes = require("./create-nodes");
  var createClusters = require("./create-clusters");
  var createEdgeLabels = require("./create-edge-labels");
  var createEdgePaths = require("./create-edge-paths");
  var positionNodes = require("./position-nodes");
  var positionEdgeLabels = require("./position-edge-labels");
  var positionClusters = require("./position-clusters");
  var shapes = require("./shapes");
  var arrows = require("./arrows");
  var util = require("./util");


  var fn = function(svg, g, opts) {

    var time = opts && opts.debugTiming ? util.time : util.notime;

    console.log('prepocessing graph...');

    time("prepocessing graph", () => preProcessGraph(g));


    var outputGroup = createOrSelectGroup(svg, "output");
    console.log('output group done...');

    var clustersGroup = createOrSelectGroup(outputGroup, "clusters");
    console.log('cluster group done...');

    var edgePathsGroup = createOrSelectGroup(outputGroup, "edgePaths");
    console.log('edge path group done...');

    var edgeLabels = createEdgeLabels(createOrSelectGroup(outputGroup, "edgeLabels"), g);
    console.log('edge labels done...');

    var nodes = createNodes(createOrSelectGroup(outputGroup, "nodes"), g, shapes);
    console.log('node creation done...');


    time("layout", ()=>layout(g));

    time("positioning nodes", () => positionNodes(nodes, g));
    time("positioning, edge labels", () => positionEdgeLabels(edgeLabels, g));
    time("create edge path", () => createEdgePaths(edgePathsGroup, g, arrows));

    var clusters = createClusters(clustersGroup, g);
    time("positionClusters", () =>positionClusters(clusters, g));


    time("postprocessing graph", () => postProcessGraph(g));
  };

  fn.createNodes = function(value) {
    if (!arguments.length) return createNodes;
    createNodes = value;
    return fn;
  };

  fn.createClusters = function(value) {
    if (!arguments.length) return createClusters;
    createClusters = value;
    return fn;
  };

  fn.createEdgeLabels = function(value) {
    if (!arguments.length) return createEdgeLabels;
    createEdgeLabels = value;
    return fn;
  };

  fn.createEdgePaths = function(value) {
    if (!arguments.length) return createEdgePaths;
    createEdgePaths = value;
    return fn;
  };

  fn.shapes = function(value) {
    if (!arguments.length) return shapes;
    shapes = value;
    return fn;
  };

  fn.arrows = function(value) {
    if (!arguments.length) return arrows;
    arrows = value;
    return fn;
  };

  return fn;
}

var NODE_DEFAULT_ATTRS = {
  paddingLeft: 10,
  paddingRight: 10,
  paddingTop: 10,
  paddingBottom: 10,
  rx: 0,
  ry: 0,
  shape: "rect"
};

var EDGE_DEFAULT_ATTRS = {
  arrowhead: "normal",
  curve: d3.curveLinear
};

function preProcessGraph(g) {
  g.nodes().forEach(function(v) {
    var node = g.node(v);
    if (!_.has(node, "label") && !g.children(v).length) { node.label = v; }

    if (_.has(node, "paddingX")) {
      _.defaults(node, {
        paddingLeft: node.paddingX,
        paddingRight: node.paddingX
      });
    }

    if (_.has(node, "paddingY")) {
      _.defaults(node, {
        paddingTop: node.paddingY,
        paddingBottom: node.paddingY
      });
    }

    if (_.has(node, "padding")) {
      _.defaults(node, {
        paddingLeft: node.padding,
        paddingRight: node.padding,
        paddingTop: node.padding,
        paddingBottom: node.padding
      });
    }

    _.defaults(node, NODE_DEFAULT_ATTRS);

    _.each(["paddingLeft", "paddingRight", "paddingTop", "paddingBottom"], function(k) {
      node[k] = Number(node[k]);
    });

    // Save dimensions for restore during post-processing
    if (_.has(node, "width")) { node._prevWidth = node.width; }
    if (_.has(node, "height")) { node._prevHeight = node.height; }
  });

  g.edges().forEach(function(e) {
    var edge = g.edge(e);
    if (!_.has(edge, "label")) { edge.label = ""; }
    _.defaults(edge, EDGE_DEFAULT_ATTRS);
  });
}

function postProcessGraph(g) {
  _.each(g.nodes(), function(v) {
    var node = g.node(v);

    // Restore original dimensions
    if (_.has(node, "_prevWidth")) {
      node.width = node._prevWidth;
    } else {
      delete node.width;
    }

    if (_.has(node, "_prevHeight")) {
      node.height = node._prevHeight;
    } else {
      delete node.height;
    }

    delete node._prevWidth;
    delete node._prevHeight;
  });
}

function createOrSelectGroup(root, name) {
  var selection = root.select("g." + name);
  if (selection.empty()) {
    selection = root.append("g").attr("class", name);
  }
  return selection;
}
