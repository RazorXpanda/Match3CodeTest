
const {ccclass, property} = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {
    @property(cc.Sprite)
    sprite1: cc.Sprite = null;

    @property(cc.Sprite)
    sprite2: cc.Sprite = null;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {
        this.sprite1.node.runAction(cc.moveTo(10, this.sprite2.node.getPosition()));
    }

}
