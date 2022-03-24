const chanceToStartAlive = 0.4;
const deathLimit = 3;
const birthLimit = 4;
const numberOfSteps = 2;

var width = 50;
var height = 50;
var cellmap;

class Cell {
  constructor(num, type, lifeTime){
    this.num = num;
    this.type = type;
    this.lifeTime = lifeTime;
    this.checked = false;
    this.extraInfo = null;
    this.waterAmount = (type == "water" ? 1 : 0);
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
            if(Math.random() < chanceToStartAlive){
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

          let waterPercent =  map[i][j].waterAmount * 100;
          let airPercent =  100 - waterPercent;

          let style = (waterPercent > 0 ? "style='background: linear-gradient(0deg, blue " + waterPercent + "%, white " + airPercent + "%);'" : "")

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
    
    cellmap[posX][posY] = new Cell(val, getCellType(val), null);
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
          if(lowerCell.type == "white" && currentCell.type != "gas"){
            cellmap[x+1][y] = currentCell;
            cellmap[x][y] = new Cell(0, "white", null);
          }

          if(currentCell.type == "water"){
      
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

            // 2nd rule - water splits
            if(lowerCell.type == "black" || lowerCell.waterAmount == 1){

              if(currentCell.waterAmount < 0.001){
                cellmap[x][y].waterAmount = 0;
                cellmap[x][y].type = "white";
                cellmap[x][y].num = 0;
                continue;
              }

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

                cellmap[x][y-1].num = 2;
                cellmap[x][y-1].type = "water"
                cellmap[x][y-1].waterAmount = waterAmountPerCell;
                cellmap[x][y].waterAmount = waterAmountPerCell;
              }
              else if(rightCell.type == "white"){
                let waterAmout = currentCell.waterAmount + rightCell.waterAmount;
                let waterAmountPerCell = waterAmout/2;

                cellmap[x][y+1].num = 2;
                cellmap[x][y+1].type = "water"
                cellmap[x][y+1].waterAmount = waterAmountPerCell;
                cellmap[x][y].waterAmount = waterAmountPerCell;
              }
              else if (leftCell.type == "water" && rightCell.type == "water"){
                let waterAmout = leftCell.waterAmount + currentCell.waterAmount + rightCell.waterAmount;
                let waterAmountPerCell = waterAmout/3;

                cellmap[x][y-1].waterAmount = waterAmountPerCell;
                cellmap[x][y+1].waterAmount = waterAmountPerCell;
                cellmap[x][y].waterAmount = waterAmountPerCell;
              }

              /*
              cellmap[x][y].extraInfo = "third";

              if (leftCell.type == "white"){
                cellmap[x][y-1] = new Cell(2, "water", null);
                cellmap[x][y].extraInfo = "third";
              }

              if (rightCell.type == "white"){
                cellmap[x][y+1] = new Cell(2, "water", null);
                cellmap[x][y].extraInfo = "third";
              }
            }

            if (upperCell.type == "water"){
              cellmap[x][y].extraInfo = null;
            }
            */
          
            }
          
          }

        }

      }

    }

    await delay(100);
    document.getElementById("canvas").innerHTML= drawField(cellmap);

  }
}

generateMap();