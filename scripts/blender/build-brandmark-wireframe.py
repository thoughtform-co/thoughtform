"""Build a richer technical-wire GLB from the Thoughtform brandmark .blend.

Run from Blender, for example:

  blender --background --python scripts/blender/build-brandmark-wireframe.py -- \
    --source "C:/Users/buyss/Dropbox/03_Thoughtform/01_Thoughtform Branding/02_Logo/3D/Thoughtform Brandmark 3D.blend" \
    --output "public/models/brandmark/brandmark-wire.glb"

The script is intentionally conservative: it opens the source file, duplicates
visible mesh/curve brandmark objects into an export-only collection, triangulates
them, applies a Wireframe modifier, and exports only that derived collection.
The original .blend file is not modified.
"""

from __future__ import annotations

import argparse
from pathlib import Path
import sys

import bpy


DEFAULT_SOURCE = (
    "C:/Users/buyss/Dropbox/03_Thoughtform/01_Thoughtform Branding/02_Logo/3D/"
    "Thoughtform Brandmark 3D.blend"
)
DEFAULT_OUTPUT = "public/models/brandmark/brandmark-wire.glb"
EXPORT_COLLECTION = "TF_Brandmark_Wire_Export"


def parse_args() -> argparse.Namespace:
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = []

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", default=DEFAULT_SOURCE)
    parser.add_argument("--output", default=DEFAULT_OUTPUT)
    parser.add_argument(
        "--wire-thickness",
        type=float,
        default=0.018,
        help="Wireframe modifier thickness in Blender units.",
    )
    parser.add_argument(
        "--keep-backbone",
        action="store_true",
        help="Also export a lightly decimated copy of the original mesh for extra silhouette support.",
    )
    return parser.parse_args(argv)


def visible_brandmark_objects() -> list[bpy.types.Object]:
    objects: list[bpy.types.Object] = []
    for obj in bpy.context.scene.objects:
        if obj.hide_get() or obj.hide_viewport or obj.hide_render:
            continue
        if obj.type not in {"MESH", "CURVE", "FONT"}:
            continue
        objects.append(obj)
    return objects


def reset_collection(name: str) -> bpy.types.Collection:
    existing = bpy.data.collections.get(name)
    if existing:
        for obj in list(existing.objects):
            bpy.data.objects.remove(obj, do_unlink=True)
        bpy.data.collections.remove(existing)
    collection = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(collection)
    return collection


def duplicate_as_mesh(obj: bpy.types.Object, collection: bpy.types.Collection) -> bpy.types.Object:
    dup = obj.copy()
    dup.data = obj.data.copy()
    dup.animation_data_clear()
    collection.objects.link(dup)

    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.objects.active = dup
    dup.select_set(True)
    if dup.type != "MESH":
        bpy.ops.object.convert(target="MESH")
        dup = bpy.context.object
    return dup


def apply_modifier(obj: bpy.types.Object, modifier: bpy.types.Modifier) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.modifier_apply(modifier=modifier.name)


def build_wire_object(
    source: bpy.types.Object,
    collection: bpy.types.Collection,
    wire_thickness: float,
) -> bpy.types.Object:
    wire = duplicate_as_mesh(source, collection)
    wire.name = f"{source.name}_technical_wire"

    triangulate = wire.modifiers.new("tf_triangulated_internal_facets", "TRIANGULATE")
    triangulate.quad_method = "BEAUTY"
    triangulate.ngon_method = "BEAUTY"
    apply_modifier(wire, triangulate)

    wireframe = wire.modifiers.new("tf_export_wire_struts", "WIREFRAME")
    wireframe.thickness = wire_thickness
    wireframe.offset = 0.0
    wireframe.use_even_offset = True
    wireframe.use_boundary = True
    wireframe.use_replace = True
    apply_modifier(wire, wireframe)

    # A tiny bevel keeps GLB normals stable and gives the runtime sampler true
    # hard edges to pick up without turning the asset into a glowing slab.
    bevel = wire.modifiers.new("tf_wire_micro_bevel", "BEVEL")
    bevel.width = wire_thickness * 0.16
    bevel.segments = 1
    bevel.affect = "EDGES"
    apply_modifier(wire, bevel)

    return wire


def build_backbone_object(source: bpy.types.Object, collection: bpy.types.Collection) -> bpy.types.Object:
    backbone = duplicate_as_mesh(source, collection)
    backbone.name = f"{source.name}_dim_backbone"

    triangulate = backbone.modifiers.new("tf_backbone_triangulate", "TRIANGULATE")
    triangulate.quad_method = "BEAUTY"
    triangulate.ngon_method = "BEAUTY"
    apply_modifier(backbone, triangulate)

    decimate = backbone.modifiers.new("tf_backbone_decimate", "DECIMATE")
    decimate.ratio = 0.32
    apply_modifier(backbone, decimate)
    return backbone


def assign_export_materials(objects: list[bpy.types.Object]) -> None:
    wire_mat = bpy.data.materials.new("TF dim technical gold")
    wire_mat.use_nodes = True
    bsdf = wire_mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (0.72, 0.58, 0.28, 1.0)
        bsdf.inputs["Metallic"].default_value = 0.35
        bsdf.inputs["Roughness"].default_value = 0.46

    for obj in objects:
        obj.data.materials.clear()
        obj.data.materials.append(wire_mat)


def export_glb(objects: list[bpy.types.Object], output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.export_scene.gltf(
        filepath=str(output),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
    )


def main() -> None:
    args = parse_args()
    source = Path(args.source)
    output = Path(args.output)

    if not source.exists():
        raise FileNotFoundError(f"Blend source not found: {source}")

    bpy.ops.wm.open_mainfile(filepath=str(source))
    collection = reset_collection(EXPORT_COLLECTION)
    source_objects = visible_brandmark_objects()
    if not source_objects:
        raise RuntimeError("No visible mesh/curve/font objects found to export.")

    exports: list[bpy.types.Object] = []
    for obj in source_objects:
        exports.append(build_wire_object(obj, collection, args.wire_thickness))
        if args.keep_backbone:
            exports.append(build_backbone_object(obj, collection))

    assign_export_materials(exports)
    export_glb(exports, output)
    print(f"Exported {len(exports)} object(s) to {output}")


if __name__ == "__main__":
    main()
