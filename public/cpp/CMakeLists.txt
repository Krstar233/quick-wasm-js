cmake_minimum_required(VERSION 3.0.0)
project(fib VERSION 0.1.0)

add_definitions(-std=c++11)
set (CMAKE_CXX_STANDARD 11)

include(CTest)
add_executable(fib fib.cc)

set_target_properties(fib PROPERTIES COMPILE_FLAGS "-Os -s MAIN_MODULE=2")
set_target_properties(fib PROPERTIES LINK_FLAGS    
"-Os -sWASM=1 -sEXPORTED_FUNCTIONS=['_malloc','_free'] -sEXPORTED_RUNTIME_METHODS=['UTF8ToString','stringToUTF8'] --no-entry")

set(CPACK_PROJECT_NAME ${PROJECT_NAME})
set(CPACK_PROJECT_VERSION ${PROJECT_VERSION})
include(CPack)
