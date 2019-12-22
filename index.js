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
        if(this.grid[i][j].userId == null || this.grid[i][j].userId == userId) {
            this.startReaction({cell : this.grid[i][j], userId,animationMethods})
        }
    }

    startReaction({cell, userId, animationMethods}) {
        let queue = [];
        let animationQueue = [];
        let priority = 0;
        queue.push({ cell: cell, priority: priority });
        animationMethods.addDot({i : cell.position.i, j:cell.position.j,userId});
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
                        animationQueue.push({sourceCell : currentCell, destCell : cell, priority : currentPriority+1, userId : userId});
                    }
                    currentCell.explode();
                }
            });
        }

        animationMethods.animateExplosions(animationQueue,userId);
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
    addPositionOffset(x,y,position) {
        let self = this;
        switch(position) {
            case 1: x += self.cellWidth/5; y += self.cellHeight/4.5; break;
            case 2: x += self.cellWidth/2.3; y += self.cellHeight/4.5; break;
            case 3: x += self.cellWidth/3; y += self.cellHeight/2.5; break;
            case 4: x += self.cellWidth/3; y += self.cellHeight/4; break;
        }
        return {x,y};
    }
    constructor({baseElement, rows, cols, height, width, padding, users, dotElement}) {
        this.baseElement = baseElement;
        this.rows = rows;
        this.cols = cols;
        this.height = height;
        this.width = width;
        this.padding = padding;
        this.gridStructure = new Grid({rows,cols});
        this.users = users;
        this.noOfUsers = users.length;
        this.dotElement = dotElement;
        this.turn = 0;
        let self = this;
        this.animationMethods = {
            changeTurn: function() {
                self.turn += 1;
                self.turn = self.turn % self.noOfUsers;
                self.baseElement.selectAll('.square').style('stroke',self.users[self.turn]);
            },
            addDot : function({i,j, userId}) {       
                let dotElement = self.dotElement.cloneNode(true);         
                let dot = d3.select(self.dotsGroup.node().appendChild(dotElement));
                let color = self.users[userId];
                dot.attr('height',self.cellHeight/3).attr('width', self.cellWidth/3);
                dot.select('.dotGrid').attr('stroke',color);
                self.dotElements[i][j].push(dot);
                let x = j*self.cellWidth;
                let y = i*self.cellHeight;
                let dotsPresent = self.gridStructure.grid[i][j].noOfDots;
                let pos = self.addPositionOffset(x,y,dotsPresent+1);
                x = pos.x; 
                y = pos.y;
                dot.attr('x',x).attr('y',y);
                dot.on('click', function(d) {
                    self.gridStructure.insert({i,j,userId : self.turn,animationMethods : self.animationMethods});
                });
            },
            moveDot: function(sourceI,sourceJ,sourceDotIndex,destI,destJ,destPosition, userId) {
                let x = destJ*self.cellWidth;
                let y = destI*self.cellHeight;
                let color = self.users[userId];
                let pos = self.addPositionOffset(x,y,destPosition);
                x = pos.x; 
                y = pos.y;
                let dot = self.dotElements[sourceI][sourceJ][sourceDotIndex];
                self.dotElements[sourceI][sourceJ].splice(sourceDotIndex,1);
                self.dotElements[destI][destJ].push(dot);
                dot.select('.dotGrid').attr('stroke',color);
                let animation = dot.transition()
                    .duration(500)
                    .attr("x", x)
                    .attr("y", y)
                    .transition()
                    .duration(0)
                    .on('end',() => {
                        self.dotElements[destI][destJ].forEach(function(d) {
                            d.select('.dotGrid').attr('stroke',color);
                        });
                    }).transition().duration(0);
                    
                dot.on('click', function(d) {
                    self.gridStructure.insert({i : destI,j :destJ,userId : 1,animationMethods : self.animationMethods});
                });
                return animation;
            },
            animateExplosions: function(animationQueue,userId) {
                function handleExplodeAnimation(currentQueueElement) {
                    let currentPriority = currentQueueElement.priority;
                    let needToAnimate = [];
                    while (animationQueue[0] && animationQueue[0].priority == currentPriority) {
                        needToAnimate.push({sourceCell : animationQueue[0].sourceCell, destCell : animationQueue[0].destCell});
                        animationQueue.shift();
                    }
                    for(let i = 0; i < needToAnimate.length; i++) {
                        let obj = needToAnimate[i];
                        let cellPosition = self.dotElements[obj.destCell.position.i][obj.destCell.position.j].length+1;
                        let animation = self.animationMethods.moveDot(obj.sourceCell.position.i,obj.sourceCell.position.j,0,obj.destCell.position.i,obj.destCell.position.j,cellPosition,userId);
                        if(i == needToAnimate.length-1) {
                            animation.on('end', () => {
                                if(animationQueue.length) {
                                    handleExplodeAnimation(animationQueue[0]);
                                }
                            });
                        }
                    }
                }
                if(animationQueue.length) {
                    handleExplodeAnimation(animationQueue[0]);
                } else {
                    self.animationMethods.changeTurn();
                }
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
        let self = this;
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
                            .attr('class','square')
                            .style('fill','#222')
                            .style('stroke',"#fff")
                            .on('click', function(d) {
                                let i = d.i;
                                let j = d.j;
                                gridStructure.insert({i,j,userId : self.turn,animationMethods});
                            });
        this.baseElement.selectAll('.square').style('stroke',this.users[this.turn]);
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
    padding : 20,
    users : ['green','blue','red']
}
d3.xml('sphere.svg').then(data => {
    config.dotElement = data.documentElement;
    let chainReactionGame = new ChainReactionGame(config);
})

