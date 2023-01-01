workspace(name = "mesch-org")

load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

local_repository(
    name = "jsaction",
    path = "./vnd/jsaction",
)

# The version used by default by io_bazel_rules_closure is too old and missing
# files that are actually used.
load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")
http_archive(
    name = "bazel_skylib",
    urls = [
        "https://mirror.bazel.build/github.com/bazelbuild/bazel-skylib/releases/download/1.3.0/bazel-skylib-1.3.0.tar.gz",
        "https://github.com/bazelbuild/bazel-skylib/releases/download/1.3.0/bazel-skylib-1.3.0.tar.gz",
    ],
    sha256 = "74d544d96f4a5bb630d465ca8bbcfe231e3594e5aae57e1edbf17a6eb3ca2506",
)
load("@bazel_skylib//:workspace.bzl", "bazel_skylib_workspace")
bazel_skylib_workspace()

# The http_archive() below is lacking the declarations with webtesting.
local_repository(
    name = "io_bazel_rules_closure",
    path = "./vnd/rules_closure",
)

# From https://github.com/bazelbuild/rules_closure#setup.

# http_archive(
#     name = "io_bazel_rules_closure",
#     sha256 = "9498e57368efb82b985db1ed426a767cbf1ba0398fd7aed632fc3908654e1b1e",
#     strip_prefix = "rules_closure-0.12.0",
#     urls = [
#         "https://mirror.bazel.build/github.com/bazelbuild/rules_closure/archive/0.12.0.tar.gz",
#         "https://github.com/bazelbuild/rules_closure/archive/0.12.0.tar.gz",
#     ],
# )

load("@io_bazel_rules_closure//closure:repositories.bzl",
     "rules_closure_dependencies", "rules_closure_toolchains")
rules_closure_dependencies()
rules_closure_toolchains()

# Only needed if you want to run your tests on headless Chrome
load("@io_bazel_rules_closure//closure:defs.bzl", "setup_web_test_repositories")
setup_web_test_repositories(
   chromium = True,
)
