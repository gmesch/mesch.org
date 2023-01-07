load("@io_bazel_rules_closure//closure:defs.bzl", "closure_js_binary", "closure_js_library")

closure_js_binary(
    name="test_bin",
    deps=[
        ":test_lib",
    ],
    formatting="PRETTY_PRINT",
    output_wrapper="function(){ %output% }.call(this)",
    property_renaming_report="test_bin_renaming_report",
)

closure_js_library(
    name="test_lib",
    srcs=[
        "test.js",
    ],
)
