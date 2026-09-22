import { Composition, Folder } from "remotion";
import { FactumationPromo } from "./compositions/FactumationPromo";
import { FactumationFeatures } from "./compositions/FactumationFeatures";
import { FactumationDemo } from "./compositions/FactumationDemo";
import { FactumationUseCase } from "./compositions/FactumationUseCase";
import "./style.css";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Factumation">
        <Composition
          id="FactumationPromo"
          component={FactumationPromo}
          durationInFrames={600}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            title: "Factumation",
            subtitle: "Créez vos factures en quelques clics",
          }}
        />
        <Composition
          id="FactumationFeatures"
          component={FactumationFeatures}
          durationInFrames={900}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            isConnected: false,
          }}
        />
        <Composition
          id="FactumationFeaturesConnected"
          component={FactumationFeatures}
          durationInFrames={1200}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            isConnected: true,
          }}
        />
        <Composition
          id="FactumationDemo"
          component={FactumationDemo}
          durationInFrames={1500}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{}}
        />
        <Composition
          id="FactumationUseCase"
          component={FactumationUseCase}
          durationInFrames={1500}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{}}
        />
      </Folder>
    </>
  );
};
