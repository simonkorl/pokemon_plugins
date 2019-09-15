//=============================================================================
 /*:
 * @plugindesc v0.10; This plugin removes evade system in RMMV and change the fomula of hitting target into Pokemon's style of Gen5
 * @author Monster Circuit
 *
 * @param miss message
 * @disc the text shows when a skill misses
 * @default It missed the target.
 *
 * @help
 * 
 * This script modifies the original hit system into Pokemon Gen5's style.
 * You can edit the success rate in the database of skills to adjust their change to hit the target.
 *
 *=============================================================================
 *   Pokemon Acurracy System in Gen5 (Simplified Chinese Version)
 *=============================================================================
 * 技能命中值
 * 每个招式都有命中值设定，命中的取值范围在0～100。
 * 通过技能命中值乘以命中修正，产生实际的命中率，并以命中率进行命中判定。
 * 命中值为0的招式在游戏中显示为“--”，不经过命中判定，使用后必定能命中。
 * 命中值变动的招式
 * 雷电的命中值在雨天为必中，晴天下为50。
 * 暴风的命中值在雨天为必中，晴天下为50。
 * 暴风雪的命中值在冰雹天气为必中。
 *  一击必杀技的命中率采用特殊的公式，不受命中修正效果影响。
 * 
 * ============================================================================
 *   How to use
 * ============================================================================
 * In the database, the skill's interface has a parameter called 'success rate'.
 * Input 0~100 in this blank. 
 * 
 * 0 means the skill will always hit the target.
 * 
 * When the value is not 0, the hit rate is calculated as follows:
 * successRate * acurrayModifierRate / 100
 * if the value is more than 1, then the skill guarantees a hit.
 * 
 * the accuracy moidifier rate is listed below:
 * -6 3/9
 * -5 3/8
 * -4 3/7
 * -3 3/6
 * -2 3/5
 * -1 3/4
 * 0 3/3
 * 1 4/3
 * 2 5/3
 * 3 6/3
 * 4 7/3
 * 5 8/3
 * 6 9/3
 * ============================================================================
 *   Version
 * ============================================================================
 * v0.10  the plugin can function correctly with stat modifier.
 * But traits and weather modify are not realized.
 */
//=============================================================================

var MC = MC || {};
MC.PKM = MC.PKM || {};
MC.PKM.AcuSystem = MC.PKM.AcuSystem || {};
MC.PKM.Parameters = PluginManager.parameters('MC_PKM_AcuSystem');
MC.PKM.AcuSystem.__acuRate = [3/9,3/8,3/7,3/6,3/5,3/4,3/3,4/3,5/3,6/3,7/3,8/3,9/3];
if(Imported.MC_PKM_StatModifier){
    Game_Action.prototype.itemHit = function(target) {
        if(this.item().successRate === 0) //todo add more always hit situation
            return 1;
        //todo get skill basic acurracy
        if(this.item().isOHKO){
            //todo add OHKO
            return 0;
        }
        else{
            var acu,eva;
            acu = BattleManager.getStatModifier(this.subject().isEnemy(),5);
            eva = BattleManager.getStatModifier(this.subject().isActor(),6);
            //if(target.trait === "天然"){
            //  acu = 0;
            //}
            //if(this.subject().trait === "天然"){
            // eva = 0;
            //}
            if(eva > 0){
                for(var i = 0;i < target.states().length; ++i){
                    if(target.states()[i].name.match(/(?:嗅觉)|(?:识破)|(?:奇迹之眼)/)){
                        eva = 0;
                    }
                }
            }
            acu -= eva;
            acu = acu.clamp(-6,6);
            //todo add more traits
            return this.item().successRate * MC.PKM.AcuSystem.__acuRate[acu + 6] / 100;
        }
    }
    
    Game_Action.prototype.itemEva = function(){
        return 0;
    }
}
else{
    alert("You need to install 'MC_PKM_StatModifier' to use 'MC_PKM_AcuSystem'. If you have already got one, place the former above the latter.");
}