class Grid {
    constructor({ rows, cols }) {
        this.rows = rows;
        this.cols = cols;

        this.grid = [];
        for (let i = 0; i < rows; i++) {
            this.grid.push([]);
            for (let j = 0; j < cols; j++) {
                let maxNoOfDots = this.getAllNeighbours({ i: i, j: j });
                this.grid[i].push(new Cell({ maxNoOfDots:maxNoOfDots.length, noOfDots: 0, postion: { i: i, j: j }, userId: null }));
            }
        }
    }

    insert(i, j, userId) {
        this.startReaction(this.grid[i][j], userId)
    }

    startReaction(cell, userId) {
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
            console.log(needToInsert)
            needToInsert.map(function (currentCell) {
                
                let data = currentCell.insert(userId);

                if (data.explode) {
                    //push all neighbour
                    let neighbours = self.getAllNeighbours(currentCell.postion);
                    for(let i = 0;i < neighbours.length; i++){
                        let cell = self.grid[neighbours[i][0]][neighbours[i][1]]
                        queue.push({cell:cell,priority:currentPriority+1});
                    }
                    currentCell.explode();
                }
            });
        }
    }

    getAllNeighbours(postion) {
        let i = postion.i;
        let j = postion.j;
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
    constructor({ noOfDots, userId, postion, maxNoOfDots }) {
        this.noOfDots = noOfDots;
        this.userId = userId;
        this.postion = postion;
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
        console.log("Explosion called for ",this);
        this.noOfDots = 0;
    }
}


let grid = new Grid({ rows: 4, cols: 4, minNoOfDots: 1 })

grid.insert(0,1,1);
grid.insert(0,1,1);
grid.insert(0,2,1);
grid.insert(1,1,1);
grid.insert(1,1,1);
grid.insert(1,1,1);
grid.insert(1,2,1);
grid.insert(1,2,1);
grid.insert(1,2,1);
grid.insert(2,1,1);
grid.insert(2,1,1);
grid.insert(2,1,1);
grid.insert(2,2,1);
grid.insert(2,2,1);
grid.insert(2,2,1);
grid.insert(1,1,1);
console.log(grid.grid)
