class Grid {
    constructor({ rows, cols }) {
        this.rows = rows;
        this.cols = cols;

        this.grid = [];
        for (let i = 0; i < rows; i++) {
            this.grid.push([]);
            for (let j = 0; j < cols; j++) {
                let maxNoOfDots = this.getAllNeighbours({ i: i, j: j });
                this.grid[i].push(new Cell({ maxNoOfDots:maxNoOfDots.length, noOfDots: 0, position: { i: i, j: j }, userId: null }));
            }
        }
    }

    insert({i, j, userId, animationMethods}) {
        this.startReaction({cell : this.grid[i][j], userId,animationMethods})
    }

    startReaction({cell, userId, animationMethods}) {
        let queue = [];
        let priority = 0;
        queue.push({ cell: cell, priority: priority });
        let self = this;
        while (queue.length !== 0) {
            let currentPriority = queue[0].priority;
            let needToInsert = [];
            while (queue[0] && queue[0].priority == currentPriority) {
                needToInsert.push(queue[0].cell);
                queue.shift();
            }
            needToInsert.map(function (currentCell) {
                
                let data = currentCell.insert(userId);

                if (data.explode) {
                    //push all neighbour
                    let neighbours = self.getAllNeighbours(currentCell.position);
                    for(let i = 0;i < neighbours.length; i++){
                        let cell = self.grid[neighbours[i][0]][neighbours[i][1]]
                        queue.push({cell:cell,priority:currentPriority+1});
                    }
                    currentCell.explode();
                } else {
                    animationMethods.addDot({i : currentCell.position.i, j:currentCell.position.j});
                }
            });
        }
    }

    getAllNeighbours(position) {
        let i = position.i;
        let j = position.j;
        let neighbourArray = [[i - 1, j], [i + 1, j], [i, j - 1], [i, j + 1]];
        let rows = this.rows;
        let cols = this.cols;
        let grid = this.grid;
        neighbourArray = neighbourArray.filter(function (arr) {
            let i = arr[0];
            let j = arr[1];
            return i >= 0 && j >= 0 && i < rows && j < cols;
        })

        let returnArray = [];

        for (let i = 0; i < neighbourArray.length; i++) {
            let point = neighbourArray[i];
            returnArray.push(point);
        }
        return returnArray;
    }
}

class Cell {
    constructor({ noOfDots, userId, position, maxNoOfDots }) {
        this.noOfDots = noOfDots;
        this.userId = userId;
        this.position = position;
        this.maxNoOfDots = maxNoOfDots;
    }

    insert(userId) {
        this.noOfDots++;
        this.userId = userId;
        if (this.noOfDots == this.maxNoOfDots) {
            return {
                explode: true,
                noOfDots: this.noOfDots
            }
        } else {
            return {
                explode : false,
                noOfDots : this.noOfDots
            }
        }
    }
    explode() {
        this.noOfDots = 0;
    }
}



class ChainReactionGame{
    constructor({baseElement, rows, cols, height, width, padding}) {
        this.baseElement = baseElement;
        this.rows = rows;
        this.cols = cols;
        this.height = height;
        this.width = width;
        this.padding = padding;
        this.gridStructure = new Grid({rows,cols});
        let self = this;
        this.animationMethods = {
            addDot : function({i,j}) {
                
                let dot = self.dotsGroup.append('image').attr('height',self.cellHeight/3).attr('width', self.cellWidth/3).attr('xlink:href','sphere.svg');
                self.dotElements[i][j].push(dot);
                let x = j*self.cellWidth;
                let y = i*self.cellHeight;
                let dotsPresent = self.gridStructure.grid[i][j].noOfDots;
                switch(dotsPresent) {
                    case 1: x+= self.cellWidth/3; y += self.cellHeight/3; break;
                    case 2: x+= self.cellWidth/3+5; y += self.cellHeight/3+5; break;
                }
                dot.attr('x',x).attr('y',y);
            }
        }
        this.initializeGrid();
    }
    initializeGrid() {
        this.gridWidth = this.width - 2*this.padding;
        this.gridHeight = this.height - 2*this.padding;
        this.cellWidth = this.gridWidth/this.cols;
        this.cellHeight = this.gridHeight/this.rows;
        let gridStructure = this.gridStructure;
        let animationMethods = this.animationMethods;
        let data = [];
        let cellElements = [];
        
        for(let row = 0; row < this.rows; row++) {
            data.push([]);
            cellElements.push([]);
            for(let col =0; col < this.cols; col++) {
                data[row].push({
                    i : row,
                    j : col,
                    x : col*this.cellWidth,
                    y : row*this.cellHeight,
                    width : this.cellWidth,
                    height : this.cellHeight,
                    dots : this.gridStructure.grid[row][col].noOfDots,
                    userId : this.gridStructure.grid[row][col].userId
                });
                cellElements[row].push(null);
            }
        }
        let gridSVG = this.baseElement.append('svg').attr('height',this.height).attr('width',this.width).attr('class','gridSvg');
        let row = gridSVG.selectAll('.row').data(data).enter().append("g").attr("class","row");
        let column = row.selectAll('.square').data(function(d){
                                                    return d;
                                                })
                        .enter().append('rect')
                            .attr('x', function(d){return d.x})
                            .attr('y', function(d){return d.y})
                            .attr('width', function(d){return d.width})
                            .attr('height', function(d){return d.height})
                            .style('fill','#222')
                            .style('stroke',"#fff")
                            .on('click', function(d) {
                                let i = d.i;
                                let j = d.j;
                                gridStructure.insert({i,j,userId : 1,animationMethods});
                            });
        let dotsGroup = gridSVG.append('g').attr('class','dots');
        this.dotsGroup = dotsGroup;
        this.cellElements = cellElements;
        this.dotElements = new Array();
        for(let i = 0; i < this.rows;i ++) {
            this.dotElements[i] = new Array();
            for(let j = 0; j < this.cols; j++) {
                this.dotElements[i][j] = new Array();
            }
        }
    }
}

let config = {
    baseElement : d3.select(".diagram"),
    rows : 10,
    cols : 10,
    height : 600,
    width : 600,
    padding : 20
}
let chainReactionGame = new ChainReactionGame(config);

