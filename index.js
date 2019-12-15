class Grid {
    constructor({rows,cols, minNoOfDots}) {
        this.rows = rows;
        this.cols = cols;
        this.minNoOfDots = minNoOfDots;

        this.grid = [];
        for(let i =0; i< rows;i++){
            for(let j=0;j<cols; j++) {
                this.grid.push(new Cell({minNoOfDots, noOfDots:0,postion: {i : i, j : j}, userId : null}));
            }
        }
        console.log(this.grid)
    }

    insert(i, j, userId) {
        this.startReaction(this.grid[i][j], userId)
    }

    startReaction(cell, userId) {
        let queue = [];
        let priority = 0;
        queue.push({cell:cell,priority:priority});
        
        while(queue.length !== 0){
            let currentPriority = queue[0].priority;
            let needToInsert = [];
            while(queue[0].priority == currentPriority){
                needToInsert.push(queue[0]);
                queue.shift();
            }
            needToInsert.map(function(currentCell) {
                let data = currentCell.cell.insert(userId);

                if(data.explode){
                    //push all neighbour
                    currentCell.getAllNeighbours(currentCell.cell.postion);
                    //queue.push({cell:currentCell.cell,priority:currentPriority+1})
                    currentCell.cell.explode();
                }
            });
        }
    }

    getAllNeighbours(postion){
        let neighbourArray = [];
    }
}

class Cell {
    constructor({noOfDots,userId,postion, maxNoOfDots}){
        this.noOfDots = noOfDots;
        this.userId = userId;
        this.postion = postion;
        this.maxNoOfDots = maxNoOfDots;
    }

    insert(userId) {
        this.noOfDots++;
        this.userId = userId;
        if(this.noOfDots == 3){
            return {
                explode:true,
                noOfDots: this.noOfDots
            }
        }
    }
    explode(){
        this.noOfDots = 0;
    }
}

let grid = new Grid({rows:4,cols:5,minNoOfDots:1})
