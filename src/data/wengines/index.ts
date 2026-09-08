import type { WEngine } from "@/types/WEngine";

import weeping_craddle from "./support/weeping_craddle.json"; //Rina
import practiced_perfection from "./anomaly/practiced_perfection.json"; //Alice
import demara_battery_mark_ii from "./stun/demara_battery_mark_ii.json"; //Anby
import drill_rig_red_axis from "./attack/drill_rig_red_axis.json"; //Anton
import angel_in_the_shell from "./anomaly/angel_in_the_shell.json"; //Aria
import zanshin_herb_case from "./attack/zanshin_herb_case.json"; //Harumasa
import elegant_vanity from "./support/elegant_vanity.json"; //Astra Yao
import wrathful_vajra from "./rupture/wrathful_vajra.json"; //Banyue
import big_cylinder from "./defense/big_cylinder.json"; //Ben
import starlight_engine_replica from "./attack/starlight_engine_replica.json"; //Billy
import flamemaker_shaker from "./anomaly/flamemaker_shaker.json"; //Burnice
import tusks_of_fury from "./defense/tusks_of_fury.json"; //Caesar
import serpentine_seeker from "./attack/serpentine_seeker.json"; //Cissia
import housekeeper from "./attack/housekeeper.json"; //Corin
import yesterday_calls from "./stun/yesterday_calls.json"; //Dialyn
import deep_sea_visitor from "./attack/deep_sea_visitor.json"; //Ellen
import heartstring_nocturne from "./attack/heartstring_nocturne.json"; //Evelyn
import fusion_complier from "./anomaly/fusion_complier.json"; //Grace
import hailstorm_shrine from "./anomaly/hailstorm_shrine.json"; //Miyabi
import myriad_eclipse from "./attack/myriad_eclipse.json"; //Hugo
import sharpened_stinger from "./anomaly/sharpened_stinger.json"; //Jane Doe
import roaring_fur_nace from "./stun/roaring_fur_nace.json"; //Ju Fufu
import hellfire_gears from "./stun/hellfire_gears.json"; //Koleda
import grill_o_wisp from "./rupture/grill_o_wisp.json"; //Manato
import blazing_laurel from "./stun/blazing_laurel.json"; //Lighter
import dreamlit_hearth from "./support/dreamlit_hearth.json"; //Lucia
import kaboom_the_cannon from "./support/kaboom_the_cannon.json"; //Lucy
import neon_fantasies from "./stun/neon_fantasies.json"; //Nangong Yu
import steel_cushion from "./attack/steel_cushion.json"; //Nekomata
import the_vault from "./support/the_vault.json"; //Nicole
import chief_sidekick from "./stun/chief_sidekick.json"; //Norma
import bellicose_blaze from "./attack/bellicose_blaze.json"; //Orphie & Magus
import tremor_trigram_vessel from "./defense/tremor_trigram_vessel.json"; //Pan Yinhu
import roaring_ride from "./anomaly/roaring_ride.json"; //Piper
import frostfall_sickle from "./anomaly/frostfall_sickle.json"; //Promeia
import box_cutter from "./stun/box_cutter.json"; //Pulchra
import sol_exuvia from "./attack/sol_exuvia.json"; //Pyrois
import ice_jade_teapot from "./stun/ice_jade_teapot.json"; //Qingyi
import ode_of_resurrected_wings from "./anomaly/ode_of_resurrected_wings.json"; //Remielle
import cordis_germina from "./attack/cordis_germina.json"; //Seed
import peacekeeper_specialized from "./defense/peacekeeper_specialized.json"; //Seth
import knights_extolment from "./attack/knights_extolment.json"; //sigrid
import severed_innocence from "./attack/severed_innocence.json"; //Soldier 0 - Anby
import the_brimstone from "./attack/the_brimstone.json"; //Soldier 11
import bashful_demon from "./support/bashful_demon.json"; //Soukaku
import starlight_rider_faceplate from "./rupture/starlight_rider_faceplate.json"; //Starlight - Billy Kid
import thoughtbop from "./support/thoughtbop.json"; //Sunna
import spectral_gaze from "./stun/spectral_gaze.json"; //Trigger
import timeweaver from "./anomaly/timeweaver.json"; //Yanagi
import metanukimorphosis from "./support/metanukimorphosis.json"; //Yuzuha
import joyau_dore from "./anomaly/joyau_dore.json"; //Velina
import flight_of_fancy from "./anomaly/flight_of_fancy.json"; //Vivian
import the_restrained from "./stun/the_restrained.json"; //Lycaon
import cloudcleave_radiance from "./attack/cloudcleave_radiance.json";
import krakens_cradle from "./rupture/krakens_cradle.json"; //Yidhari
import qingming_birdcage from "./rupture/qingming_birdcage.json"; //Yixuan
import half_sugar_bunny from "./defense/half_sugar_bunny.json"; //Zhao
import riot_suppressor_mark_vi from "./attack/riot_suppressor_mark_vi.json"; //Zhu Yuan

import boisterous_echoes from "./anomaly/boisterous_echoes.json";
import electro_lip_gloss from "./anomaly/electro_lip_gloss.json";
import rainforest_gourmet from "./anomaly/rainforest_gourmet.json";
import weeping_gemini from "./anomaly/weeping_gemini.json";
import starlight_engine from "./attack/starlight_engine.json";
import glided_blossom from "./attack/glided_blossom.json";
import street_superstar from "./attack/street_superstar.json";
import marcato_desire from "./attack/marcato_desire.json";
import cannon_rotor from "./attack/cannon_rotor.json";
import original_transmorpher from "./defense/original_transmorpher.json";
import bunny_band from "./defense/bunny_band.json";
import spring_embrace from "./defense/spring_embrace.json";
import reel_projector from "./defense/reel_projector.json";
import cauldron_of_clarity from "./rupture/cauldron_of_clarity.json";
import puzzle_sphere from "./rupture/puzzle_sphere.json";
import radiowave_journey from "./rupture/radiowave_journey.json";
import steam_oven from "./stun/steam_oven.json";
import precious_fossilized_core from "./stun/precious_fossilized_core.json";
import six_shooter from "./stun/six_shooter.json";
import slice_of_time from "./support/slice_of_time.json";
import the_simmering_pot from "./stun/the_simmering_pot.json";
import unfettered_game_ball from "./support/unfettered_game_ball.json";

export const wEngines: WEngine[] = [
  //MAYBE ADD WENGINE SKILL FOR BIG CYLINDER

  weeping_craddle as WEngine, //✅
  practiced_perfection as WEngine, //✅
  demara_battery_mark_ii as WEngine, //✅
  drill_rig_red_axis as WEngine, //✅
  angel_in_the_shell as WEngine, //✅
  zanshin_herb_case as WEngine, //✅
  elegant_vanity as WEngine, //✅
  wrathful_vajra as WEngine, //✅
  big_cylinder as WEngine, //✅
  starlight_engine_replica as WEngine, //✅
  flamemaker_shaker as WEngine, //✅
  tusks_of_fury as WEngine, //✅
  serpentine_seeker as WEngine,
  housekeeper as WEngine, //✅
  yesterday_calls as WEngine, //✅
  deep_sea_visitor as WEngine, //✅
  heartstring_nocturne as WEngine, //✅
  fusion_complier as WEngine, //✅
  hailstorm_shrine as WEngine, //✅
  myriad_eclipse as WEngine, //✅
  sharpened_stinger as WEngine, //✅
  roaring_fur_nace as WEngine, //✅
  hellfire_gears as WEngine, //✅
  grill_o_wisp as WEngine, //✅
  blazing_laurel as WEngine, //✅
  dreamlit_hearth as WEngine, //✅
  kaboom_the_cannon as WEngine, //✅
  neon_fantasies as WEngine, //✅
  steel_cushion as WEngine, //✅
  the_vault as WEngine, //✅
  chief_sidekick as WEngine,
  bellicose_blaze as WEngine, //✅
  tremor_trigram_vessel as WEngine,
  roaring_ride as WEngine, //✅
  frostfall_sickle as WEngine, //✅
  box_cutter as WEngine, //✅
  sol_exuvia as WEngine,
  ice_jade_teapot as WEngine, //✅
  ode_of_resurrected_wings as WEngine,
  cordis_germina as WEngine, //✅
  peacekeeper_specialized as WEngine,
  knights_extolment as WEngine,
  severed_innocence as WEngine, //✅
  the_brimstone as WEngine, //✅
  bashful_demon as WEngine, //✅
  starlight_rider_faceplate as WEngine,
  thoughtbop as WEngine, //✅
  spectral_gaze as WEngine, //✅
  timeweaver as WEngine, //✅
  qingming_birdcage as WEngine, //✅
  metanukimorphosis as WEngine, //✅
  joyau_dore as WEngine,
  flight_of_fancy as WEngine, //✅
  the_restrained as WEngine, //✅
  cloudcleave_radiance as WEngine, //✅
  krakens_cradle as WEngine, //✅
  half_sugar_bunny as WEngine, //✅
  riot_suppressor_mark_vi as WEngine, //✅

  boisterous_echoes as WEngine,
  electro_lip_gloss as WEngine, //✅
  rainforest_gourmet as WEngine, //✅
  weeping_gemini as WEngine, //✅
  street_superstar as WEngine, //✅
  starlight_engine as WEngine, //✅
  glided_blossom as WEngine, //✅
  marcato_desire as WEngine, //✅
  cannon_rotor as WEngine, //✅
  original_transmorpher as WEngine, //✅
  bunny_band as WEngine, //✅
  spring_embrace as WEngine, //✅
  reel_projector as WEngine, //✅
  cauldron_of_clarity as WEngine, //✅
  puzzle_sphere as WEngine, //✅
  radiowave_journey as WEngine, //✅
  steam_oven as WEngine, //✅
  precious_fossilized_core as WEngine, //✅
  six_shooter as WEngine, //✅
  slice_of_time as WEngine, //✅
  the_simmering_pot as WEngine, //✅
  unfettered_game_ball as WEngine, //✅
];
