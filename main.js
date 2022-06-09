const chanceToStartAlive = 0.4;
const deathLimit = 3;
const birthLimit = 4;
const numberOfSteps = 2;

var width = 40;
var height = 40;
var cellmap;

class Cell {
  constructor(num, type, lifeTime){
    this.num = num;
    this.type = type;
    this.lifeTime = lifeTime;
    this.checked = false;
    this.aboveInfoColor = "white";
    this.waterAmount = (type == "water" ? 1 : 0);
    this.woodAmount = (type == "wood" ? 1 : 0);
  }
}

function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

function simulationStepOnClick(){
  cellmap = doSimulationStep(cellmap);
  document.getElementById("canvas").innerHTML= drawField(cellmap);
}

function zeros(dimensions) {
    var array = [];
    for (var i = 0; i < dimensions[0]; ++i) {
        array. push(dimensions.length == 1 ? 0 : zeros(dimensions. slice(1)));
    }
    return array;
}

function initialiseMap(map){
    for(let x=0; x<width; x++){
        for(let y=0; y<height; y++){
            if(Math.random() < chanceToStartAlive || x == 0 || y == 0 || x == width -1 || y == height -1){
                map[x][y] = new Cell(1, "black", null);
            }
            else{
              map[x][y] = new Cell(0, "white", null);
            }
        }
    }
    return map;
}

function countAliveNeighbours(map, x, y){
    let count = 0;
    for(let i = -1; i < 2; i++){
        for(let j = -1; j < 2; j++){
            let neighbour_x = x+i;
            let neighbour_y = y+j;

            if(i == 0 && j == 0) continue;
            
            //In case the index we're looking at it off the edge of the map
            else if(neighbour_x < 0 || neighbour_y < 0 || neighbour_x >= map.length || neighbour_y >= map[0].length){
                count = count + 1;
            }

            //Otherwise, a normal check of the neighbour
            else if(map[neighbour_x][neighbour_y].num == 1){
                count = count + 1;
            }
        }
    }

    return count;
}

function doSimulationStep(oldMap){
    
    newMap = zeros([width, height]);

    //Loop over each row and column of the map
    for(let x = 0; x < oldMap.length; x++){
        for(let y = 0; y < oldMap[0].length; y++){

            let nbs = countAliveNeighbours(oldMap, x, y);

            //if a cell is alive but has too few neighbours, kill it.
            if(oldMap[x][y].num == 1){
                if(nbs < deathLimit){
                    newMap[x][y] = new Cell(0, "white", null);
                }
                else{
                    newMap[x][y] = new Cell(1, "black", null);
                }
            } 
            //if the cell is dead now, check if it has the right number of neighbours to be 'born'
            else{
                if(nbs > birthLimit){
                    newMap[x][y] = new Cell(1, "black", null);
                }
                else{
                    newMap[x][y] = new Cell(0, "white", null);
                }
            }
        }
    }

    return newMap;
}

function getCellType(cell){
  if (cell == 0) return "white";
  if (cell == 1) return "black";
  if (cell == 2) return "water";
  if (cell == 3) return "wood";
  if (cell == 4) return "fire";
  if (cell == 5) return "sand";
  if (cell == 6) return "smoke";
}

function drawField(map) {

    let html = "";

    for(let i = 0; i < height; i++){
        html += "<div class='gridrow'>";
        for(let j = 0; j < width; j++) {

          let style = "";

          if(map[i][j].type == "water"){
            let waterPercent =  (map[i][j].waterAmount * 100);
            let topPercent =  100 - waterPercent;

            if (waterPercent > 0.999 && !map[i][j].aboveInfoColor)
              style = "style='background: linear-gradient(0deg, blue " + waterPercent + "%, white " + topPercent + "%);'";
            else if (waterPercent > 1 && map[i][j].aboveInfoColor)
              style = "style='background: linear-gradient(0deg, blue " + waterPercent + "%, " + map[i][j].aboveInfoColor + " " + waterPercent + "% " + topPercent + "%);'";
          }

          if(map[i][j].type == "wood"){

            let woodPercent =  (map[i][j].woodAmount * 100);
            let topPercent =  100 - woodPercent;

            if (woodPercent > 0.999 && !map[i][j].aboveInfoColor)
              style = "style='background: linear-gradient(0deg, brown " + woodPercent + "%, white " + topPercent + "%);'";
            else if (woodPercent > 1 && map[i][j].aboveInfoColor)
              style = "style='background: linear-gradient(0deg, brown " + woodPercent + "%, " + map[i][j].aboveInfoColor + " " + woodPercent + "% " + topPercent + "%);'";

          }

          html += "<div class='cell " + (map[i][j].type) + "' onclick='changeCellType(this)' " + style + " id='" + i + "," + j + "'></div>";
        }
        html += "</div>"
    }

    return html;

}

function changeCellType(el){
    let posX = el.id.split(",")[0];
    let posY = el.id.split(",")[1];

    let val = document.getElementById("select-cell-type").value;
    
    cellmap[posX][posY] = new Cell(val, getCellType(val), (val == 4 ||val == 6 ? 10 : null));
    el.className = "cell " + getCellType(val);
}

function generateMap(){

    //Create a new map
    cellmap = zeros([width, height]);

    //Set up the map with random values
    cellmap = initialiseMap(cellmap);

    //And now run the simulation for a set number of steps
    for(let i=0; i<numberOfSteps; i++){
        cellmap = doSimulationStep(cellmap);
    }

    document.getElementById("canvas").innerHTML= drawField(cellmap);

}

async function startSimulation(){
  let simulationSteps = 100;

  for(let i = 0; i < simulationSteps; i++){

    for(let x = 0; x < width; x++){
      for(let y = 0; y < height; y++){
        cellmap[x][y].checked = false;
      }
    }

    // Loop all cels
    for(let x = width-1; x >= 0; x--){
      for(let y = height-1; y >= 0; y--){
      
        if (cellmap[x][y].type != "white" &&  cellmap[x][y].type != "black" && !cellmap[x][y].checked){

          let currentCell = cellmap[x][y]; 
          let lowerCell = cellmap[x+1][y];
          let upperCell = cellmap[x-1][y];
          let leftCell = cellmap[x][y-1];
          let rightCell = cellmap[x][y+1];

          cellmap[x][y].checked = true;

          // vse (razen dima) pade če spodnja celica ni živa
          if(lowerCell.type == "white" && currentCell.type != "smoke"){
            cellmap[x+1][y] = currentCell;
            cellmap[x][y] = new Cell(0, "white", null);
          }

          // dim se dviga
          if(currentCell.type == "smoke" && upperCell.type == "white"){
            cellmap[x-1][y] = currentCell;
            cellmap[x][y] = new Cell(0, "white", null);
          }

          if(currentCell.type == "water"){

            // destroy water if percentage too small
            if(currentCell.waterAmount < 0.01){
              cellmap[x][y].waterAmount = 0;
              cellmap[x][y].type = "white";
              cellmap[x][y].num = 0;
              continue;
            }

            // water splits up and down
            if(lowerCell.type == "water" && lowerCell.waterAmount < 1){
              let gapVolume = 1 -  lowerCell.waterAmount;

              if (currentCell.waterAmount <= gapVolume){ // spodnja še vedno ne bo polna             
                cellmap[x+1][y].waterAmount += currentCell.waterAmount;

                cellmap[x][y].type = "white";
                cellmap[x][y].num = 0;
                cellmap[x][y].waterAmount = 0;
              }
              else{
                cellmap[x+1][y].waterAmount = 1;
                cellmap[x][y].waterAmount -= gapVolume;
              }
            }

            // water splits left and right
            if(lowerCell.type == "black" || lowerCell.waterAmount == 1){

              // empty
              if (leftCell.type == "white" && rightCell.type == "white"){
                let waterAmout = leftCell.waterAmount + currentCell.waterAmount + rightCell.waterAmount;
                let waterAmountPerCell = waterAmout/3;

                cellmap[x][y-1].num = 2;
                cellmap[x][y-1].type = "water"
                cellmap[x][y-1].waterAmount = waterAmountPerCell;

                cellmap[x][y+1].num = 2;
                cellmap[x][y+1].type = "water"
                cellmap[x][y+1].waterAmount = waterAmountPerCell;

                cellmap[x][y].waterAmount = waterAmountPerCell;

              }
              else if(leftCell.type == "white"){
                let waterAmout = leftCell.waterAmount + currentCell.waterAmount;
                let waterAmountPerCell = waterAmout/2;

                //nastavi tip celice na vodo
                cellmap[x][y-1].num = 2;
                cellmap[x][y-1].type = "water"

                cellmap[x][y-1].waterAmount = waterAmountPerCell;
                cellmap[x][y].waterAmount = waterAmountPerCell;
              }
              else if(rightCell.type == "white"){
                let waterAmout = currentCell.waterAmount + rightCell.waterAmount;
                let waterAmountPerCell = waterAmout/2;

                //nastavi tip celice na vodo
                cellmap[x][y+1].num = 2;
                cellmap[x][y+1].type = "water"

                cellmap[x][y+1].waterAmount = waterAmountPerCell;
                cellmap[x][y].waterAmount = waterAmountPerCell;
              }

              // water
              else if (leftCell.type == "water" && rightCell.type == "water"){
                let waterAmout = leftCell.waterAmount + currentCell.waterAmount + rightCell.waterAmount;
                let waterAmountPerCell = waterAmout/3;

                cellmap[x][y-1].waterAmount = waterAmountPerCell;
                cellmap[x][y+1].waterAmount = waterAmountPerCell;
                cellmap[x][y].waterAmount = waterAmountPerCell;
              }
              else if (leftCell.type == "water"){
                let waterAmout = leftCell.waterAmount + currentCell.waterAmount;
                let waterAmountPerCell = waterAmout/2;

                cellmap[x][y-1].waterAmount = waterAmountPerCell;
                cellmap[x][y].waterAmount = waterAmountPerCell;
              }
              else if (rightCell.type == "water"){
                let waterAmout = rightCell.waterAmount + currentCell.waterAmount;
                let waterAmountPerCell = waterAmout/2;

                cellmap[x][y+1].waterAmount = waterAmountPerCell;
                cellmap[x][y].waterAmount = waterAmountPerCell;
              }
          
            }

            // če voda pade na les ga izpodrine
            if(lowerCell.type == "wood"){
              cellmap[x+1][y] = currentCell;
              cellmap[x][y] = lowerCell;
            }
          
          }

          if(currentCell.type == "wood"){
            // les plava na vodi
            if (lowerCell.type == "water" && lowerCell.waterAmount < 1){
              let gapAboveWater = 1 - lowerCell.waterAmount;
              let makeGapAboveWood = 1 - gapAboveWater;

              cellmap[x+1][y].aboveInfoColor = "brown";
              cellmap[x][y].woodAmount = makeGapAboveWood;
            }

            // da vmesni del med dvema škatlama pobarva
            if (currentCell.woodAmount < 1 && upperCell.type == "wood"){
              cellmap[x][y].aboveInfoColor = "brown"
            }
          }

          if(currentCell.type == "fire"){
            
            // če pride v stik z lesom, ga uniči
            if(lowerCell.type == "wood"){
              cellmap[x+1][y] = new Cell(4, "fire", 10);

              // zgoraj nastane dim
              cellmap[x][y] = new Cell(6, "smoke", 8);

              // poglej če je v spodnji celici potrebno odstraniti gradient
              if (cellmap[x+2][y].aboveInfoColor != "white"){
                cellmap[x+2][y].aboveInfoColor = "white"
              }
            }

            // širjenje ognja
            if(upperCell.type == "wood"){
              cellmap[x-1][y] = new Cell(6, "smoke", 8);

              if (cellmap[x][y].aboveInfoColor != "white"){
                cellmap[x][y].aboveInfoColor = "white"
              }
            }
            if(leftCell.type == "wood"){
              cellmap[x][y-1] = new Cell(4, "fire", 10);

              cellmap[x-1][y-1] = new Cell(6, "smoke", 8);

              if (cellmap[x+1][y-1].aboveInfoColor != "white"){
                cellmap[x+1][y-1].aboveInfoColor = "white"
              }
            }
            if(rightCell.type == "wood"){
              cellmap[x][y+1] = new Cell(4, "fire", 10);

              cellmap[x-1][y+1] = new Cell(6, "smoke", 8);

              if (cellmap[x+1][y+1].aboveInfoColor != "white"){
                cellmap[x+1][y+1].aboveInfoColor = "white";
              }
            }

            // ogenj izgine ob stiku z vodo in del vode izpari
            if(lowerCell.type == "water"){
              cellmap[x][y] = new Cell(0, "white", null);
              cellmap[x+1][y].waterAmount *= 0.8;
            }
            if(upperCell.type == "water"){
              cellmap[x][y] = new Cell(0, "white", null);
              cellmap[x-1][y].waterAmount *= 0.8;
            }
            if(leftCell.type == "water"){
              cellmap[x][y] = new Cell(0, "white", null);
              cellmap[x][y-1].waterAmount *= 0.8;
            }
            if(rightCell.type == "water"){
              cellmap[x][y] = new Cell(0, "white", null);
              cellmap[x][y+1].waterAmount *= 0.8;
            }
          }


          // preveri če celico uničimo
          if(currentCell.lifeTime == 0){
            cellmap[x][y] = new Cell(0, "white", null);
          }
          else if (currentCell.lifeTime > 0){
            cellmap[x][y].lifeTime -= 1;
          }

        }

      }

    }

    await delay(100);
    document.getElementById("canvas").innerHTML= drawField(cellmap);

  }
}

generateMap();