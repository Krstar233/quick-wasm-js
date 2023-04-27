#include <emscripten.h>
#include <stdio.h>
#include <string>
#include <cstdlib>
#include <ctime>

extern "C" {

EMSCRIPTEN_KEEPALIVE
int fib(int n) {
  int i, t, a = 0, b = 1;
  for (i = 0; i < n; i++) {
    t = a + b;
    a = b;
    b = t;
  }
  return b;
}

EMSCRIPTEN_KEEPALIVE
void greet(char* str) {
  printf("\033[31m%s\033[0m\n", str);
}

EMSCRIPTEN_KEEPALIVE
void printInt8Array(int8_t* ptr, int len) {
  for (int i = 0; i < len; i++) {
    printf("%d ", ptr[i]);
  }
  printf("\n");
}

EMSCRIPTEN_KEEPALIVE
void printInt16Array(int16_t* ptr, int len) {
  for (int i = 0; i < len; i++) {
    printf("%d ", ptr[i]);
  }
  printf("\n");
}

EMSCRIPTEN_KEEPALIVE
void printInt32Array(int32_t* ptr, int len) {
  for (int i = 0; i < len; i++) {
    printf("%d ", ptr[i]);
  }
  printf("\n");
}

EMSCRIPTEN_KEEPALIVE
void printFloat32Array(float* ptr, int len) {
  for (int i = 0; i < len; i++) {
    printf("%f ", ptr[i]);
  }
  printf("\n");
}

EMSCRIPTEN_KEEPALIVE
void printFloat64Array(double* ptr, int len) {
  for (int i = 0; i < len; i++) {
    printf("%lf ", ptr[i]);
  }
  printf("\n");
}

EMSCRIPTEN_KEEPALIVE
void printUInt8Array(uint8_t* ptr, int len) {
  for (int i = 0; i < len; i++) {
    printf("%u ", ptr[i]);
  }
  printf("\n");
}

EMSCRIPTEN_KEEPALIVE
void printUInt16Array(uint16_t* ptr, int len) {
  for (int i = 0; i < len; i++) {
    printf("%u ", ptr[i]);
  }
  printf("\n");
}

EMSCRIPTEN_KEEPALIVE
void printUInt32Array(uint32_t* ptr, int len) {
  for (int i = 0; i < len; i++) {
    printf("%u ", ptr[i]);
  }
  printf("\n");
}

EMSCRIPTEN_KEEPALIVE
float* mockRandom(int len) {
  time_t now;
  time(&now);
  srand(now);
  float* ptr = (float*) malloc(sizeof(float)*len);
  for (int i = 0; i < len; i++) {
    ptr[i] = (rand() % 1000) / 10.0;
  }
  return ptr;
}

}