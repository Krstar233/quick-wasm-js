const source =
`cmake_minimum_required(VERSION 3.0.0)
project(out VERSION 0.1.0 LANGUAGES C CXX)

set(CMAKE_CXX_STANDARD 11)
set(CMAKE_C_STANDARD_REQUIRED ON)
set(CMAKE_C_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include(CTest)

# 递归添加源文件
file(GLOB_RECURSE SRC_FILES_CPP "*.cpp")
file(GLOB_RECURSE SRC_FILES_CC "*.cc")
file(GLOB_RECURSE SRC_FILES_C "*.c")
set(SRC_FILES \${SRC_FILES_CPP} \${SRC_FILES_CC} \${SRC_FILES_C})

# 将源文件添加到可执行目标
add_executable(out \${SRC_FILES})

# 设置 FLAG
set_target_properties(out PROPERTIES COMPILE_FLAGS "-Os -sMAIN_MODULE=2")
set_target_properties(out PROPERTIES LINK_FLAGS
    "-Os -sWASM=1 -sMODULARIZE=1 -sEXPORTED_FUNCTIONS=['_malloc','_free'] -sEXPORTED_RUNTIME_METHODS=['UTF8ToString','stringToUTF8'] --no-entry")

set(CPACK_PROJECT_NAME \${PROJECT_NAME})
set(CPACK_PROJECT_VERSION \${PROJECT_VERSION})
include(CPack)`
export default source