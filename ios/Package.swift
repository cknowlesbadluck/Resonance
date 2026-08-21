// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "ResonanceIOS",
    platforms: [
        .iOS(.v17),
        .macOS(.v14)
    ],
    products: [.library(name: "ResonanceCore", targets: ["ResonanceCore"])],
    targets: [
        .target(name: "ResonanceCore"),
        .testTarget(name: "ResonanceCoreTests", dependencies: ["ResonanceCore"])
    ]
)
