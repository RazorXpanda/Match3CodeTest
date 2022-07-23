// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import Tile from "./Tile";

const {ccclass, property} = cc._decorator;

@ccclass
export default class BoardManager extends cc.Component {

    @property(cc.Node)
    gridParent: cc.Node = null;

    @property([cc.SpriteFrame])
    sprites: Array<cc.SpriteFrame> = [];

    @property(cc.Prefab)
    tilePrefab: cc.Prefab = null;

    @property (Number)
    gridDimension: number = null;

    @property (Number)
    distance: number = null;

    @property (cc.Label)
    scoreLabel: cc.Label;

    public grid: cc.Node[][] = [];

    private _score: number = 0;    

    // 0 =  idle
    // 1 = moving
    public state: number = 0;

    public get score() : number {
        return this._score;
    }

    public set score(value: number)
    {
        this._score = value;
        this.scoreLabel.string = this._score.toString();
    }
    


    // Singleton (I know its bad but i dont have time uwu)
    private static instance: BoardManager;

    public static get Instance(){
        return this.instance
    }
    
    start()
    {
        this.score = 0;
    }

    onLoad()
    {
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        BoardManager.instance = this;
        this.grid = [...Array(this.gridDimension)].map(e => Array(this.gridDimension));
        this.InitGrid();
    }

    onKeyDown(event) 
    {
        switch(event.keyCode) {
            case cc.macro.KEY.e:
                console.log('Press e key');
                this.CheatCode();
                break;
        }
    }

    private CheatCode()
    {
        this.grid[0][0].getComponent(cc.Sprite).spriteFrame = this.sprites[4]
        this.grid[0][1].getComponent(cc.Sprite).spriteFrame = this.sprites[4]
        this.grid[0][2].getComponent(cc.Sprite).spriteFrame = this.sprites[4]
        this.grid[0][4].getComponent(cc.Sprite).spriteFrame = this.sprites[4]
        //this.grid[3][2].getComponent(cc.Sprite).spriteFrame = this.sprites[4]
    }

    protected InitGrid()
    {
        const lol =  new cc.Vec3((this.gridDimension * this.distance / 2.0), this.gridDimension * this.distance / 2.0, 0);
        let positionOffset = this.node.position.sub(lol);

        for (let row = 0; row < this.gridDimension; row++)
        {
            for (let col = 0; col < this.gridDimension; col++)
            {
                let possibleSprites = [];

                // slice(0) essentially copies the entire array into possibleSprites empty array
                if (possibleSprites != null && possibleSprites.length < this.sprites.length)
                {
                    possibleSprites = this.sprites.slice(0);
                }

                //Choose what sprite to use for this cell
                let left1 = this.GetSpriteFrameAt(col - 1, row);
                let left2 = this.GetSpriteFrameAt(col - 2, row);

                // if two left sprite frames are the same
                // we remove the sprite frame from the array, so it spawns without instantly gaining points
                if (left2 != null && left1 == left2) // 3
                {
                    const index = possibleSprites.indexOf(left1);
                    if (index > -1)
                    {
                        let removed = possibleSprites.splice(index, 1);
                    }
                }

                let down1 = this.GetSpriteFrameAt(col, row - 1);
                let down2 = this.GetSpriteFrameAt(col, row - 2);

                // if two bottom sprite frames are the same
                // we remove the sprite frame from the array, so it spawns without instantly gaining points
                if (down2 != null && down1 == down2)
                {
                    const index = possibleSprites.indexOf(down1);
                    if (index > -1)
                    {
                        let removed = possibleSprites.splice(index, 1);
                    }
                }  

                // Init set up of tile prefab in grid
                // I instantiated the tile Prefab, assigned a random sprite into the spriteFrame property
                // And then add the Tile script onto it
                // Lastly set the parent to the grid.parent object
                let newTile = cc.instantiate(this.tilePrefab);
                let tileSprite = newTile.getComponent(cc.Sprite);
                tileSprite.spriteFrame = possibleSprites[this.getRandomInt(0, possibleSprites.length)];
                tileSprite.node.addComponent(Tile);
                newTile.setParent(this.gridParent);

                newTile.position = new cc.Vec3(col * this.distance, row * this.distance, 0).add(positionOffset);

                //Assigns it to the grid
                this.grid[col][row] = newTile;    
            }
        }
    }

    private GetSpriteFrameAt(column: number, row: number)
    {
        if (column < 0 || column >= this.gridDimension || row < 0 || row >= this.gridDimension)
            return null;
        let tile = this.grid[column][row];
        let spriteframe = tile.getComponent(cc.Sprite).spriteFrame;
        return spriteframe;
    }

    private GetSpriteObjectAt(column: number, row: number)
    {
        if (column < 0 || column >= this.gridDimension || row < 0 || row >= this.gridDimension)
            return null;
        let node = this.grid[column][row];
        return node;
    }

    private CheckMatch(): boolean
    {
        let matchedTiles: Array<cc.Node> = [];
        let tempArray: Array<cc.Node> = [];
        let gridArray: number[][] = [];
        let gridArray_temp: number[][] = [];

        for (let row = 0; row < this.gridDimension; row++)
        {
            for (let column = 0; column < this.gridDimension; column++)
            {
                let current: cc.Node = this.GetSpriteObjectAt(column, row);

                let horizontalMatches: Array<cc.Node> = this.FindColumnMatchForTile(column, row, current.getComponent(cc.Sprite).spriteFrame);
                let horizontalGridValues: number[][] = this.FindColumnMatchForTile_Grid(column, row, current.getComponent(cc.Sprite).spriteFrame);

                if (horizontalMatches.length >= 2)
                {
                    tempArray = matchedTiles.concat(horizontalMatches);
                    tempArray.push(current);
                    matchedTiles = tempArray;

                    gridArray_temp = gridArray.concat(horizontalGridValues);
                    gridArray_temp.push([column, row])
                    gridArray = gridArray_temp

                    this.score += 1;
                    tempArray = [];
                    gridArray_temp = [];
                }

                let verticalMatches: Array<cc.Node> = this.FindRowMatchForTile(column, row, current.getComponent(cc.Sprite).spriteFrame);
                let verticalGridValues: number[][] = this.FindRowMatchForTile_Grid(column, row, current.getComponent(cc.Sprite).spriteFrame);
                if (verticalMatches.length >= 2)
                {
                    tempArray = matchedTiles.concat(verticalMatches);
                    tempArray.push(current);
                    matchedTiles = tempArray;

                    gridArray_temp = gridArray.concat(verticalGridValues);
                    gridArray_temp.push([column, row])
                    gridArray = gridArray_temp
                    
                    this.score += 1;
                    tempArray = [];
                    gridArray_temp = [];
                }
            }
        }
        //cc.log(matchedTiles)
        
        matchedTiles.forEach(function (item)
        {
            item.destroy();
            //item.getComponent(cc.Sprite).spriteFrame = null;
        })

        for (let counter = 0; counter < gridArray.length; counter++)
        {
            let column = gridArray[counter][0]
            let row = gridArray[counter][1]

            this.grid[column][row] = null
        }

        return matchedTiles.length > 0;
    }

    private FindColumnMatchForTile(col: number, row: number, sprite: cc.SpriteFrame)
    {
        let result: Array<cc.Node> = [];
        for (let i = col + 1; i < this.gridDimension; i++)
        {
            let nextColumn = this.GetSpriteObjectAt(i, row);
            if (nextColumn.getComponent(cc.Sprite).spriteFrame.name != sprite.name)
            {
                break;
            }
            result.push(nextColumn);
        }
        return result;
    }

    private FindColumnMatchForTile_Grid(col: number, row: number, sprite: cc.SpriteFrame)
    {
        let arr: number[][] = [];
        for (let i = col + 1; i < this.gridDimension; i++)
        {
            let nextColumn = this.GetSpriteObjectAt(i, row);
            if (nextColumn.getComponent(cc.Sprite).spriteFrame.name != sprite.name)
            {
                break;
            }
            arr.push([i,row])
        }
        return arr;
    }

    private FindRowMatchForTile(col: number, row: number, sprite: cc.SpriteFrame)
    {
        let result: Array<cc.Node> = [];
        for (let i = row + 1; i < this.gridDimension; i++)
        {
            let nextRow = this.GetSpriteObjectAt(col, i);
            if (nextRow.getComponent(cc.Sprite).spriteFrame.name != sprite.name)
            {
                break;
            }
            result.push(nextRow);
        }
        return result;
    }

    private FindRowMatchForTile_Grid(col: number, row: number, sprite: cc.SpriteFrame)
    {
        let arr: number[][] = [];
        for (let i = row + 1; i < this.gridDimension; i++)
        {
            let nextRow = this.GetSpriteObjectAt(col, i);
            if (nextRow.getComponent(cc.Sprite).spriteFrame.name != sprite.name)
            {
                break;
            }
            arr.push([col,i])
        }
        return arr;
    }

    private FillHoles()
    {
        for (let col = 0; col < this.gridDimension; col++)
        {
            for (let row = 0; row < this.gridDimension; row++)
            {
                if (this.grid[col][row] == null)
                {
                    // STACKING PORTIONS
                    // Detects the next available null object
                    for (let nextFill = row + 1; nextFill < this.gridDimension; nextFill ++)
                    {
                        // Empty Node initialization
                        this.grid[col][row] = new cc.Node()
                        this.grid[col][row].position = cc.v3((col - 3) * 100, (row - 3) * 100, 0);
                        let emptyGridNode = this.grid[col][row]

                        if (this.grid[col][nextFill] != null)
                        {
                            // when next available item is found
                            // grabs that nodes position and move it ot the current position, including modifying the grid
                            // moves the new object to the first null position
                            let fillInGridNode = this.grid[col][nextFill]

                            Promise
                            .all([
                                this.moveNodeToPosition(fillInGridNode, cc.v3(emptyGridNode.position), 0.1),
                                this.grid[col][row] = fillInGridNode,
                                this.grid[col][nextFill] = null
                            ])
                            //cc.log(this.grid)
                            break;
                        }

                        // Last row does not have nodes/sprites
                        else if (nextFill == this.gridDimension - 1 && this.grid[col][nextFill] == null)
                        {
                            let newNode = this.instantiateNode(col)

                            Promise
                            .all([
                                this.moveNodeToPosition(newNode, cc.v3(emptyGridNode.position), 0.1),
                                this.grid[col][row] = newNode,
                            ])
                        }
                        else
                        {
                            continue;
                        }
                    }
                    if (row == 5)
                    {
                        // FINAL TILE PORTION
                        //cc.log(col)
                        //cc.log(row)
                        this.grid[col][row] = new cc.Node()
                        this.grid[col][row].position = cc.v3((col - 3) * 100, (row - 3) * 100, 0);
                        let emptyGridNode = this.grid[col][row]

                        let newNode = this.instantiateNode(col)

                        Promise
                        .all([
                            this.moveNodeToPosition(newNode, cc.v3(emptyGridNode.position), 0.1),
                            this.grid[col][row] = newNode,
                        ])
                    }
                }
            }
        }
    }

    private instantiateNode(col: number)
    {
        let newNode = cc.instantiate(this.tilePrefab)
        let nodeSprite = newNode.getComponent(cc.Sprite);
        nodeSprite.spriteFrame = this.sprites[this.getRandomInt(0, this.sprites.length)];
        nodeSprite.addComponent(Tile);
        newNode.setParent(this.gridParent);
        // row is temporary
        newNode.setPosition(cc.v3((col - 3) * 100, 300, 0));
        return newNode
    }

    public async SwapTiles(xSelected: number, ySelected: number, xThis: number, yThis: number)
    {
        this.state = 1;
        let selectedNode = this.grid[xSelected][ySelected];
        let thisNode = this.grid[xThis][yThis];

        Promise
            .all([
                this.moveNodeToPosition(selectedNode, cc.v3(thisNode.position), 0.1),
                this.moveNodeToPosition(thisNode, cc.v3(selectedNode.position), 0.1),
                this.grid[xThis][yThis] = selectedNode,
                this.grid[xSelected][ySelected] = thisNode
            ])
            //Delays by 1 second
            .then(await new Promise(f => setTimeout(f, 1000)))

        let changesOccurs: boolean = this.CheckMatch();   
        if(!changesOccurs)
        {
            cc.log("Hello")
            let selectedNodeSwitched = this.grid[xThis][yThis]
            let thisNodeSwitched = this.grid[xSelected][ySelected]
            Promise
            .all([
                this.moveNodeToPosition(thisNode, cc.v3(selectedNode.position), 0.1),
                this.moveNodeToPosition(selectedNode, cc.v3(thisNode.position), 0.1),
                this.grid[xSelected][ySelected] = selectedNodeSwitched,
                this.grid[xThis][yThis] = thisNodeSwitched
            ])
            .then(await new Promise(f => setTimeout(f, 0)))
            this.state = 0;
        }
        else
        {
            do
            {
                this.FillHoles();     
                // delays by half a second, cool effect
                await new Promise(f => setTimeout(f, 500))
            }
            while (this.CheckMatch());
            this.state = 0;
        }
    }

    private moveNodeToPosition(target: cc.Node, position: cc.Vec3, duration: number) : Promise<unknown>
    {
        return new Promise(resolve =>
        {
            cc.tween(target)
                .to(duration, { position: position })
                .call(() => resolve(null))
                .start();
        });
    }

    private getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
    }

    private ResetBoard():void
    {
        for (let row = 0; row < this.gridDimension; row++)
        {
            for (let column = 0; column < this.gridDimension; column++)
            {
                this.grid[row][column].getComponent(cc.Sprite).spriteFrame = null;
                this.grid[row][column] = null;
            }
        }
        this.score = 0;
        this.InitGrid();
    }

    public InfoBox(): void
    {
        window.alert("I Love Fruits");
    }

    private calculateScore(matchedTiles)
    {

    }
}
