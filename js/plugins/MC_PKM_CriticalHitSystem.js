//=============================================================================
 /*:
 * @plugindesc v1.00; This plugin replace the original CT(critical hit) system into Pokemon's Critical System (Only based on Gen5)
 * @author Monster Circuit
 *
 * @param HPandMPFormula
 * @desc Calculates the values of HP and MP. Default: (((param * 2 + paramIv + (paramEv/4) + 100) * level)/100) + level + 10
 * @default (((param * 2 + paramIv + (paramEv/4) + 100) * level)/100) + level + 10
 *
 *
 * @help
 * 
 * This Script does both adding critical hit level into BattleManager (as ctl) and modifying the original ct system in RMMV into
 * that in Pokemon
 *
 *=============================================================================
 *   Pokemon Critcal Hit System in Gen5 (Simplified Chinese Version)
 *=============================================================================
 * 第三世代至第五世代
 * 击中要害的几率从0到4分为5个级别，一般的攻击招式有0级即1/16的几率击中要害，容易击中要害的招式有1级即1/8的几率。
 * 等级	0	1	2	3	4
 * 几率	1/16 1/8 1/4 1/3 1/2
 * 通过技能、特性或道具的效果，最高可以将高击中要害的几率等级提高到4级。
 * 一般技能基础会心等级为0，急所技基础会心等级为1。
 * 攻击方拥有强运特性，会心等级+1。
 * 攻击方携带道具聚焦镜、锋锐之爪时，会心等级+1。
 * 攻击方处于聚气状态时，会心等级+2。
 * 攻击方是携带幸运拳套的吉利蛋时，会心等级+2。
 * 攻击方是携带长葱的大葱鸭时，会心等级+2。
 * 会心一击率最高为4级，大于4级的按4级计算。
 * 山岚、冰息的会心率为6级，不经过计算，直接拥有1/1的会心率。
 * 如果防御方是战斗盔甲、硬壳盔甲时，不会出现会心一击。
 * 如果防御方处于咒语状态，不会出现会心一击。
 * 
 * ============================================================================
 *   Notetag
 * ============================================================================
 * <ct level: X> or <ctl : X> 
 * X is a single number in [0,4] and 6 meaning the basic critical hit level. 6 represents guaranteed critical hit.
 * X is 0 at default
 * ============================================================================
 */
//=============================================================================

var MC = MC || {};
MC.PKM = MC.PKM || {};
MC.PKM.CTSystem = MC.PKM.CTSystem || {};

MC.PKM.Parameters = PluginManager.parameters('MC_PKM_CriticalHitSystem');
MC.PKM.CTSystem.ctRate = [1/16,1/8,1/4,1/3,1/2];

//=============================
// notetag
//============================
MC.PKM.CTSystem._DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
DataManager.isDatabaseLoaded = function() {
    if (!MC.PKM.CTSystem._DataManager_isDatabaseLoaded.call(this)) return false;
    if (!MC.PKM.CTSystem._isloaded) {
      this.processCtNoteTag($dataSkills);
      MC.PKM.CTSystem._isloaded = true;
    }
        return true;
}
DataManager.processCtNoteTag = function(group){
    var ctNote = /<\s*ctl?\s*(?:level)?:?\s*(\d)\s*>/i;
    for (var n = 1; n < group.length; n++) {
		var obj = group[n];
        var notedata = obj.note.split(/[\r\n]+/);
        obj.ctl = 0;
		for (var i = 0,line = "",myArray; i < notedata.length; i++) {
            line = notedata[i];
            myArray = line.match(ctNote);
			if (myArray) {
                obj.ctl = parseInt(myArray[1]);
            }
		}
	}
}
//============================================
// replace the original ct system
//============================================

Game_Action.prototype.itemCri = function(target) {
    if(this.isSkill()){
        var states = target.states();
        var ctl = 0;
        for(var i = 0;i < states.length; ++i){
            if(states[i].name === "咒语")
                return 0;
            else if(states[i].name === "聚气"){
                ctl += 2;
                break;
            }
        }
        //todo traits will avoid critical hit
        if(this.item().ctl >= 5)
            return 1;
        ctl += this.item().ctl;
        //todo ctl with traits
        //todo ctl with item
        ctl = ctl.clamp(0,4);
        return MC.PKM.CTSystem.ctRate[ctl];
    }
    else
        return 0;
    
};