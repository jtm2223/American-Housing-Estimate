// add your JavaScript/D3 to this file
Promise.all([
    d3.json("d3Data/US_States.json"), // GeoJSON for US states
    d3.json("d3Data/d3Data.json")       // processed data
]).then(([geoData, stateData]) => {
    const stateMap = new Map(
      stateData.map(d => [d.STATE_NAME.toLowerCase().trim(), d])
    );

    const color = d3.scaleSequential(d3.interpolateViridis)
      .domain([Math.log(d3.min(stateData, d => d.state_median)), Math.log(d3.max(stateData, d => d.state_median))])
      .interpolator(d3.interpolateViridis);

    const projection = d3.geoAlbersUsa()
        .scale(950)
        .translate([400, 250]);

    const path = d3.geoPath().projection(projection);
    
    const svg = d3.select("div#plot").append("svg")
      .attr("width", 800)
      .attr("height", 500);

    // Add the title
    svg.append("text")
        .attr("x", 400)
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .attr("font-size", "20px")
        .attr("font-weight", "bold")
        .text("Median Housing Values for Units With Mortgages by State");
    
    // Add the subtitle
    svg.append("text")
        .attr("x", 400)
        .attr("y", 35)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .attr("font-style", "italic")
        .attr("fill", "gray")
        .text("(Hover over the state to see the counties with the most expensive units)");

    svg.selectAll("path")
        .data(geoData.features)
        .enter().append("path")
        .attr("d", path)
        .attr("fill", d => {
            const state = stateMap.get(d.properties.NAME.toLowerCase().trim());
            return state ? color(Math.log(state.state_median)) : "#ccc";
        })
        .attr("stroke", "#333")
        .on("mouseover", (event, d) => {
          const state = stateMap.get(d.properties.NAME.toLowerCase().trim());
          const tooltipHtml = state
              ? `<strong>${d.properties.NAME}</strong><br>Median Value: $${state.state_median}<br>Top 5 Counties:<ul>` +
                state.top_counties
                  .map(c => `<li>${c.county}: $${c.value}</li>`)
                  .join("") +
                `</ul>`
              : `<strong>${d.properties.NAME}</strong><br>No data`;
      
          d3.select("#tooltip")
              .style("left", `${event.pageX}px`)
              .style("top", `${event.pageY}px`)
              .style("display", "inline-block")
              .html(tooltipHtml);
        })
        .on("mouseout", () => d3.select("#tooltip").style("display", "none"));
        
        // Add tooltip container
    d3.select("body").append("div")
    .attr("id", "tooltip")
    .style("position", "absolute")
    .style("background", "#fff")
    .style("padding", "5px")
    .style("border", "1px solid #ccc")
    .style("border-radius", "4px")
    .style("display", "none");
    

    const legendWidth = 500;
    const legendHeight = 20;
    const colorScaleRange = d3.extent(stateData, d => Math.log(d.state_median));
    
    const legendSvg = d3.select("div#plot").append("svg")
        .attr("width", legendWidth + 50)
        .attr("height", legendHeight + 60)
        .style("margin-top", "20px");
    
    const defs = legendSvg.append("defs");
    const gradientId = "color-gradient";
    
    const gradient = defs.append("linearGradient")
        .attr("id", gradientId)
        .attr("x1", "0%")
        .attr("x2", "100%")
        .attr("y1", "0%")
        .attr("y2", "0%");
    
    const numStops = 10;
    for (let i = 0; i < numStops; i++) {
        const logValue = colorScaleRange[0] + i * (colorScaleRange[1] - colorScaleRange[0]) / (numStops - 1);
        gradient.append("stop")
            .attr("offset", `${(i / (numStops - 1)) * 100}%`)
            .attr("stop-color", color(logValue));
    }
    
    legendSvg.append("rect")
        .attr("x", 20)
        .attr("y", 0)
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", `url(#${gradientId})`);
    
    const legendAxisScale = d3.scaleLog()
        .domain([Math.exp(colorScaleRange[0]), Math.exp(colorScaleRange[1])])
        .range([20, legendWidth + 20]);
    
    const legendAxis = d3.axisBottom(legendAxisScale)
        .ticks(5, "$.0f");
    
    legendSvg.append("g")
        .attr("class", "legend-axis")
        .attr("transform", `translate(0, ${legendHeight + 0})`)
        .call(legendAxis)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("transform", "rotate(-45)");


}).catch(error => {
    console.error("Error loading files:", error);
});
