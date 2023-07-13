// Set chart dimensions and margins
const margin = {top: 60, right: 20, bottom: 50, left: 140};
const width = 450 - margin.left - margin.right;
const height = 350 - margin.top - margin.bottom;

// Function updateChart: Clears previous chart and draws grouped bar chart
function updateChart(dataFile, chartTitle) {
  // Remove any existing svg element so canvas is cleared from previous chart
  d3.select("svg").remove()

  // Add the svg element on which to draw the chart
  const svg = d3.select("#chart_div")
  .append("svg")
    .attr("id", "chart_svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", "0 0 450 350")
    .attr("preserveAspectRatio", "xMinYMin")
  .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // Load the .csv data file
  d3.csv("https://leoncho.github.io/cs416-narrative/data/" + dataFile)
  .then(function(data){
    // Parse data retrieved from .csv data file
    // chartValues is a data structure that holds all the values for the grouped bar chart
    //   It is nested arrays. The top level is an array of groups where each group is a
    //   group key and an array of subgroup key/value pairs.
    const chartValues = d3.rollups(data, v => d3.sum(v, d => d.value), d => d.group, d => d.subgroup)
    // console.log("chartValues")
    // console.log(chartValues)
    // groupNames is an array of the y-axis labels
    const groupNames = Array.from(chartValues).map(d => d[0])
    // subGroupNames is an array of the key names of the bars in each group
    const subGroupNames = Array.from(Array.from(chartValues)[0][1]).map(d=>d[0])
    
    // Set scale for x-axis
    const xScale = d3.scaleLinear()
        .domain([0, d3.max(data.map(d => d.value))]).nice()
        .range([0, width]);
    svg
      .append('g')
      .attr("transform", "translate(0, "+ height +")")
      .call(d3.axisBottom(xScale).tickSize(0).ticks(5).tickPadding(6).tickFormat(d3.format(".1s")))
      .call(d => d.select(".domain").remove());
    
    // Set scale for y-axis
    const yScale = d3.scaleBand()
      .domain(groupNames)
      .range([0, height])
      .padding(.2);
    svg
      .append('g')
      .call(d3.axisLeft(yScale).tickSize(0).tickPadding(8));
    
    // Set scale for subgroup
    const yScaleSubgroups = d3.scaleBand()
      .domain(subGroupNames)
      .range([0, yScale.bandwidth()])
      .padding([0.05])
    
    // Set scale for color range of bars
    const colorScale = d3.scaleOrdinal()
      .domain(subGroupNames)
      .range(['#0073BB','#8EBFFE'])
    
    // Set vertical grid line
    const GridLine = () => d3.axisBottom().scale(xScale);
    svg
      .append("g")
        .attr("class", "grid")
      .call(GridLine()
        .tickSize(height,0,0)
        .tickFormat("")
        .ticks(6)
    );
    
    // Define tooltip
    var tooltip = d3.select("#chart_div")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("border-radius", "5px")
        .style("padding", "10px")
        .style("position", "absolute")

    // Define tooltip event functions
    const mouseover = function(d) {
        tooltip
          .style("opacity", .9)
        d3.select(this)
          .style("opacity", .6)
    }

    const mousemove = function(event, d) {
      const formatter =  d3.format(",")
      let groupName = d3.select(this.parentNode).datum()[0]
      let year = (d[0] == "2019") ? "Pre-Pandemic (2019)" : "Post-Pandemic (2022)"
      tooltip
        .html(groupName + "<br />" + year + "<br />" + formatter(d[1]) + " hours")
        .style("top", (event.pageY - 10) + "px")
        .style("left", (event.pageX + 10) + "px");
    }

    const mouseleave = function(d) {
        tooltip
          .style("opacity", 0)
        d3.select(this)
          .style("opacity", 1)
    }
    
    // Draw bars in barchart
    bars = svg.append("g")
      .selectAll("g")
      .data(chartValues)
      .join("g")
        .attr("transform", d => "translate(0, " + yScale(d[0]) +")")
      .selectAll("rect")
      .data(d => { return d[1] })
      .join("rect")
        .attr("x", xScale(0))
        .attr("y", d => yScaleSubgroups(d[0]))
        .attr("width", d => xScale(d[1]))
        .attr("height", yScaleSubgroups.bandwidth())
        .attr("fill", d=>colorScale(d[0]))
      .on("mouseover", mouseover)
      .on("mousemove", mousemove)
      .on("mouseleave", mouseleave);
    
    // Draw chart title
    svg
      .append("text")
        .attr("class", "chart-title")
        .attr("x", -(margin.left)*0.7)
        .attr("y", -(margin.top)/1.5)
        .attr("text-anchor", "start")
      .text(chartTitle)
    
    // Draw tooltip instructions
    svg
    .append("text")
      .attr("class", "tooltip-instructions")
      .attr("x", -(margin.left)*0.7 + 300)
      .attr("y", -(margin.top)/1.5 + 3)
      .attr("text-anchor", "start")
    .text("Move mouse over bars in")

    svg
    .append("text")
      .attr("class", "tooltip-instructions")
      .attr("x", -(margin.left)*0.7 + 300)
      .attr("y", -(margin.top)/1.5+10)
      .attr("text-anchor", "start")
    .text("chart to see details")

    // Draw y-axis label
    svg
      .append("text")
        .attr("class", "chart-label")
        .attr("x", width/2)
        .attr("y", height+margin.bottom/2)
        .attr("text-anchor", "middle")
      .text("Average Time Spent Per Day (hours)")
    
    // Draw data source footnote
    svg
      .append("text")
        .attr("class", "data-source")
        .attr("x", -(margin.left)*0.7)
        .attr("y", height + margin.bottom*0.7)
        .attr("text-anchor", "start")
      .text("Source: U.S. Bureau of Labor Statistics")
    
    // Draw data footnote
    svg
      .append("text")
        .attr("class", "data-footnote")
        .attr("x", -(margin.left)*0.7)
        .attr("y", height + margin.bottom*0.9)
        .attr("text-anchor", "start")
      .text("Time spent by employed persons age 15 and over on working days")
    
    // Draw legend
    svg
    .append("rect")
        .attr("x", -(margin.left)*0.7)
        .attr("y", -(margin.top/2))
        .attr("width", 10)
        .attr("height", 10)
        .style("fill", "#0072BC");
    svg
        .append("text")
            .attr("class", "legend")
            .attr("x", -(margin.left)*0.7+15)
            .attr("y", -(margin.top/2.5))
        .text("Pre-Pandemic (2019)")
    svg
        .append("rect")
            .attr("x", -(margin.left)*0.7+80)
            .attr("y", -(margin.top/2))
            .attr("width", 10)
            .attr("height", 10)
            .style("fill", "#8EBEFF")
    svg
        .append("text")
            .attr("class", "legend")
            .attr("x", -(margin.left)*0.7+95)
            .attr("y", -(margin.top/2.5))
        .text("Post-Pandemic (2022)")
    })
  }

  // Function updateAnnotation: Adds annotations to the chart
  function updateAnnotation(slideNum) {
    switch(slideNum) {
      case 1:
        var annotations1 = [
          {
            note: {
              label: "Time caring for ourselves is up 1.24%",
              title: "Personal Care"
            },
            color: ["red"],
            x: 425,
            y: 72,
            dy: 30,
            dx: -30
          }
        ]
        
        var makeAnnotations1 = d3.annotation()
          .annotations(annotations1)

        d3.select("#chart_svg")
          .append("g")
          .call(makeAnnotations1)

        var annotations2 = [
          {
            note: {
              label: "Time caring for other people outside household down 37.5%",
              title: "Care for Non-Household Members"
            },
            color: ["red"],
            x: 142,
            y: 131,
            dy: 40,
            dx: 50
          }
        ]  

        var makeAnnotations2 = d3.annotation()
          .annotations(annotations2)
        
        d3.select("#chart_svg")
          .append("g")
          .call(makeAnnotations2)
        break
      case 2:
        var annotations1 = [
          {
            note: {
              label: "Men are working 0.5% less",
              title: "Men"
            },
            color: ["red"],
            x: 425,
            y: 126,
            dy: -70,
            dx: -30
          }
        ]
               
        var makeAnnotations1 = d3.annotation()
          .annotations(annotations1)

        d3.select("#chart_svg")
          .append("g")
          .call(makeAnnotations1)
       
        var annotations2 = [
          {
            note: {
              label: "Women are working 3.07% more",
              title: "Women"
            },
            color: ["red"],
            x: 398,
            y: 235,
            dy: 20,
            dx: -50
          }
        ]  

        var makeAnnotations2 = d3.annotation()
          .annotations(annotations2)
        
        d3.select("#chart_svg")
          .append("g")
          .call(makeAnnotations2)
      
        break
      case 3:
        var annotations1 = [
          {
            note: {
              label: "Spending time with our own thoughts and relaxing is up 80%",
              title: "Relaxing and Thinking"
            },
            color: ["red"],
            x: 163,
            y: 78,
            dy: 30,
            dx: 30
          }
        ]
               
        var makeAnnotations1 = d3.annotation()
          .annotations(annotations1)

        d3.select("#chart_svg")
          .append("g")
          .call(makeAnnotations1)
       
        var annotations2 = [
          {
            note: {
              label: "Spending time with and talking with others is down 21%",
              title: "Socializing/Communicating"
            },
            color: ["red"],
            x: 193,
            y: 253,
            dy: -30,
            dx: 50
          }
        ]  

        var makeAnnotations2 = d3.annotation()
          .annotations(annotations2)
        
        d3.select("#chart_svg")
          .append("g")
          .call(makeAnnotations2)
        break
      default:
        console.log("ERROR: No slide with this number")
    }
  }

  // Function updateSlide: Changes the slide -- including the chart, chart title, and annotations
  function updateSlide(slideNum) {
    switch(slideNum) {
      case 1:
        document.getElementById("nav-button-1").className = "nav-button-select"
        document.getElementById("nav-button-2").className = "nav-button"
        document.getElementById("nav-button-3").className = "nav-button"
        updateChart(
          "scene1.csv",
          "Time Spent by Activity"
        )
        document.getElementById("slide-title").innerHTML = "Are we becoming more selfish? People are spending more time on personal care and leisure -- and less time on caring for others and work."
        updateAnnotation(1)
        break;
      case 2:
        document.getElementById("nav-button-2").className = "nav-button-select"
        document.getElementById("nav-button-1").className = "nav-button"
        document.getElementById("nav-button-3").className = "nav-button"
        updateChart(
          "scene2.csv",
          "Time Worked by Gender"
        )
        document.getElementById("slide-title").innerHTML = "Men are working less and women are working more."
        updateAnnotation(2)
        break;
      case 3:
        document.getElementById("nav-button-3").className = "nav-button-select"
        document.getElementById("nav-button-1").className = "nav-button"
        document.getElementById("nav-button-2").className = "nav-button"
        updateChart(
          "scene3.csv",
          "Time Spent by Leisure Activity"
        )
        document.getElementById("slide-title").innerHTML = "Are we getting more isolated? People are socializing less and spending more time on solitary activities."
        updateAnnotation(3)
        break;
      default:
        console.log("ERROR: No slide with this number")
    }
  }

  // Start on First Slide
  updateSlide(1);