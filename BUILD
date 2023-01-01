load("@io_bazel_rules_closure//closure:defs.bzl", "closure_js_binary", "closure_js_library")

closure_js_binary(
    name="test_bin",
    deps=[
        ":test",
    ],
)

closure_js_library(
    name="test",
    srcs=[
        "test.js",
    ],
)
